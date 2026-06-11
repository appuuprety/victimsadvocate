create table if not exists public.admin_messages (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  author_email text not null default '',
  body text not null check (char_length(trim(body)) > 0 and char_length(body) <= 2000),
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_messages_created_at_idx
on public.admin_messages (created_at desc);

create index if not exists admin_messages_pinned_created_at_idx
on public.admin_messages (pinned desc, created_at desc);

alter table public.admin_messages enable row level security;

drop policy if exists "Approved admins can read messages" on public.admin_messages;
create policy "Approved admins can read messages"
on public.admin_messages for select
to authenticated
using (public.current_admin_profile() is not null);

drop policy if exists "Approved admins can create messages" on public.admin_messages;
create policy "Approved admins can create messages"
on public.admin_messages for insert
to authenticated
with check (
  public.current_admin_profile() is not null
  and author_id = auth.uid()
);

drop policy if exists "Authors and super admins can update messages" on public.admin_messages;
create policy "Authors and super admins can update messages"
on public.admin_messages for update
to authenticated
using (
  public.current_admin_profile() is not null
  and (author_id = auth.uid() or public.is_super_admin())
)
with check (
  public.current_admin_profile() is not null
  and (author_id = auth.uid() or public.is_super_admin())
);

drop policy if exists "Authors and super admins can delete messages" on public.admin_messages;
create policy "Authors and super admins can delete messages"
on public.admin_messages for delete
to authenticated
using (
  public.current_admin_profile() is not null
  and (author_id = auth.uid() or public.is_super_admin())
);
