create table if not exists public.field_guide_entries (
  id uuid primary key default gen_random_uuid(),
  section text not null default 'General',
  title text not null,
  body text not null default '',
  tags text[] not null default '{}',
  sort_order integer not null default 100,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists field_guide_entries_sort_order_idx
on public.field_guide_entries (sort_order, title);

alter table public.field_guide_entries enable row level security;

drop policy if exists "Approved admins can read field guide" on public.field_guide_entries;
create policy "Approved admins can read field guide"
on public.field_guide_entries for select
to authenticated
using (public.current_admin_profile() is not null and published = true);

drop policy if exists "Approved admins can manage field guide" on public.field_guide_entries;
create policy "Approved admins can manage field guide"
on public.field_guide_entries for all
to authenticated
using (public.current_admin_profile() is not null)
with check (public.current_admin_profile() is not null);

create or replace function public.delete_admin_profile(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_super_admin() then
    raise exception 'Super admin access required';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'You cannot delete your own admin access';
  end if;

  delete from public.admin_profiles
  where user_id = target_user_id;
end;
$$;
