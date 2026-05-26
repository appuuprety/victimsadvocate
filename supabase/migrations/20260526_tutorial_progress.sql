create table if not exists public.tutorial_step_completions (
  user_id uuid not null references auth.users(id) on delete cascade,
  step_id uuid not null references public.tutorial_steps(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, step_id)
);

create index if not exists tutorial_step_completions_user_idx
on public.tutorial_step_completions (user_id);

alter table public.tutorial_step_completions enable row level security;

drop policy if exists "Admins can read tutorial progress" on public.tutorial_step_completions;
create policy "Admins can read tutorial progress"
on public.tutorial_step_completions for select
to authenticated
using (user_id = auth.uid() or public.is_super_admin());

drop policy if exists "Admins can complete own tutorial steps" on public.tutorial_step_completions;
create policy "Admins can complete own tutorial steps"
on public.tutorial_step_completions for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Admins can update own tutorial progress" on public.tutorial_step_completions;
create policy "Admins can update own tutorial progress"
on public.tutorial_step_completions for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Admins can clear tutorial progress" on public.tutorial_step_completions;
create policy "Admins can clear tutorial progress"
on public.tutorial_step_completions for delete
to authenticated
using (user_id = auth.uid() or public.is_super_admin());

create or replace function public.reset_tutorial_progress(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if auth.uid() <> target_user_id and not public.is_super_admin() then
    raise exception 'Super admin access required';
  end if;

  delete from public.tutorial_step_completions
  where user_id = target_user_id;
end;
$$;
