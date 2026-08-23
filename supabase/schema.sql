-- allisw3ll — run this once in the Supabase SQL editor.
-- Creates the table the notebook syncs to, locked down so each account can
-- only ever read and write its own row.

create table if not exists public.notebooks (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.notebooks enable row level security;

drop policy if exists "own notebook: read"   on public.notebooks;
drop policy if exists "own notebook: insert" on public.notebooks;
drop policy if exists "own notebook: update" on public.notebooks;
drop policy if exists "own notebook: delete" on public.notebooks;

create policy "own notebook: read"
  on public.notebooks for select
  using (auth.uid() = user_id);

create policy "own notebook: insert"
  on public.notebooks for insert
  with check (auth.uid() = user_id);

create policy "own notebook: update"
  on public.notebooks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "own notebook: delete"
  on public.notebooks for delete
  using (auth.uid() = user_id);
