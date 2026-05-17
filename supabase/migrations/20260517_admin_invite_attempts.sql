create table if not exists public.admin_invite_attempts (
  id uuid primary key default gen_random_uuid(),
  invite_id uuid references public.admin_invites(id) on delete set null,
  invite_email text,
  entered_email text not null,
  matched boolean not null default false,
  attempted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.admin_invite_attempts enable row level security;

create or replace function public.log_admin_invite_attempt(invite_token text, entered_email text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  invite public.admin_invites;
  matched_exact boolean := false;
begin
  select *
  into invite
  from public.admin_invites
  where token = invite_token
    and accepted_at is null
    and expires_at > now();

  if invite.id is not null then
    matched_exact := invite.email = entered_email;
  end if;

  insert into public.admin_invite_attempts (
    invite_id,
    invite_email,
    entered_email,
    matched,
    attempted_by
  )
  values (
    invite.id,
    invite.email,
    entered_email,
    matched_exact,
    auth.uid()
  );

  return matched_exact;
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

  insert into public.admin_invite_attempts (
    invite_id,
    invite_email,
    entered_email,
    matched,
    attempted_by
  )
  values (
    invite.id,
    invite.email,
    user_email,
    invite.email = user_email,
    auth.uid()
  );

  if invite.email <> user_email then
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

drop policy if exists "Super admins can read invite attempts" on public.admin_invite_attempts;
create policy "Super admins can read invite attempts"
on public.admin_invite_attempts for select
to authenticated
using (public.is_super_admin());

drop policy if exists "Anyone can log invite attempts" on public.admin_invite_attempts;
create policy "Anyone can log invite attempts"
on public.admin_invite_attempts for insert
to anon, authenticated
with check (true);
