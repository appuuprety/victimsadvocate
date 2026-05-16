create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'admin' check (role in ('admin', 'super_admin')),
  status text not null default 'approved' check (status in ('approved', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null default 'admin' check (role in ('admin', 'super_admin')),
  token text not null unique,
  invited_by uuid references auth.users(id) on delete set null,
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

alter table public.admin_profiles enable row level security;
alter table public.admin_invites enable row level security;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles
    where user_id = auth.uid()
      and role = 'super_admin'
      and status = 'approved'
  );
$$;

create or replace function public.current_admin_profile()
returns public.admin_profiles
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.admin_profiles
  where user_id = auth.uid()
    and status = 'approved';
$$;

create or replace function public.claim_initial_super_admin()
returns public.admin_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  profile public.admin_profiles;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if exists (select 1 from public.admin_profiles where role = 'super_admin' and status = 'approved') then
    raise exception 'Initial super admin already exists';
  end if;

  insert into public.admin_profiles (user_id, email, role, status)
  values (auth.uid(), coalesce(auth.jwt() ->> 'email', ''), 'super_admin', 'approved')
  on conflict (user_id) do update
    set role = 'super_admin',
        status = 'approved',
        updated_at = now()
  returning * into profile;

  return profile;
end;
$$;

create or replace function public.accept_admin_invite(invite_token text)
returns public.admin_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  invite public.admin_invites;
  profile public.admin_profiles;
  user_email text := coalesce(auth.jwt() ->> 'email', '');
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
  into invite
  from public.admin_invites
  where token = invite_token
    and accepted_at is null
    and expires_at > now();

  if invite.id is null then
    raise exception 'Invite is invalid or expired';
  end if;

  if lower(invite.email) <> lower(user_email) then
    raise exception 'Invite does not match this account email';
  end if;

  insert into public.admin_profiles (user_id, email, role, status)
  values (auth.uid(), user_email, invite.role, 'approved')
  on conflict (user_id) do update
    set email = excluded.email,
        role = excluded.role,
        status = 'approved',
        updated_at = now()
  returning * into profile;

  update public.admin_invites
  set accepted_by = auth.uid(),
      accepted_at = now()
  where id = invite.id;

  return profile;
end;
$$;

drop policy if exists "Admins can read own profile" on public.admin_profiles;
create policy "Admins can read own profile"
on public.admin_profiles for select
to authenticated
using (user_id = auth.uid() or public.is_super_admin());

drop policy if exists "Super admins can manage profiles" on public.admin_profiles;
create policy "Super admins can manage profiles"
on public.admin_profiles for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "Super admins can manage invites" on public.admin_invites;
create policy "Super admins can manage invites"
on public.admin_invites for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "Users can read matching active invite" on public.admin_invites;
create policy "Users can read matching active invite"
on public.admin_invites for select
to anon, authenticated
using (accepted_at is null and expires_at > now());
