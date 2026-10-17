-- Interview sandbox: one generic analytics table that fits almost any prompt.
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  event_name  text not null check (char_length(event_name) between 1 and 64),
  properties  jsonb not null default '{}'::jsonb,
  user_id     text,
  created_at  timestamptz not null default now()
);

create index if not exists events_created_at_idx on public.events (created_at desc);
create index if not exists events_name_idx on public.events (event_name);

-- Row Level Security: the app uses the publishable (anon) key, so it may add and read
-- events but never update or delete them. Fine for a sandbox; tighten for production.
alter table public.events enable row level security;

drop policy if exists "sandbox can insert events" on public.events;
create policy "sandbox can insert events" on public.events
  for insert to anon, authenticated with check (true);

drop policy if exists "sandbox can read events" on public.events;
create policy "sandbox can read events" on public.events
  for select to anon, authenticated using (true);
