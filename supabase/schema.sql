-- Kirtlington Golf Day PWA - Supabase schema
-- Run this in your Supabase SQL Editor to enable live multi-phone scoring.

create table if not exists public.events (
  id text primary key,
  name text not null,
  event_date date not null default current_date,
  course_id text not null default 'kirtlington-18',
  team_allowance_pct integer not null default 85,
  individual_allowance_pct integer not null default 95,
  team_best_count integer not null default 2,
  organiser_pin text not null default '1234',
  created_at timestamptz not null default now()
);

create table if not exists public.teams (
  id text primary key,
  event_id text not null references public.events(id) on delete cascade,
  name text not null,
  join_code text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.players (
  id text primary key,
  event_id text not null references public.events(id) on delete cascade,
  team_id text not null references public.teams(id) on delete cascade,
  name text not null,
  gender text not null check (gender in ('M', 'F')),
  tee_id text not null check (tee_id in ('yellow', 'red', 'medal')),
  handicap_mode text not null default 'index' check (handicap_mode in ('index', 'course')),
  handicap_index numeric(4, 1),
  course_handicap integer,
  in_gerald boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.scores (
  event_id text not null references public.events(id) on delete cascade,
  player_id text not null references public.players(id) on delete cascade,
  hole integer not null check (hole between 1 and 18),
  gross integer not null check (gross >= 0 and gross <= 20), -- 0 represents pickup / blob
  updated_at timestamptz not null default now(),
  primary key (event_id, player_id, hole)
);

-- Enable Realtime on live scoring tables
alter publication supabase_realtime add table public.scores;
alter publication supabase_realtime add table public.players;
alter publication supabase_realtime add table public.teams;

-- Simple open RLS for a private friends/society golf day (join codes in app).
-- Tighten with auth or edge functions if ever opened to the public internet.
alter table public.events enable row level security;
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.scores enable row level security;

create policy "golf_day_events_all" on public.events for all using (true) with check (true);
create policy "golf_day_teams_all" on public.teams for all using (true) with check (true);
create policy "golf_day_players_all" on public.players for all using (true) with check (true);
create policy "golf_day_scores_all" on public.scores for all using (true) with check (true);

-- Seed the initial Kirtlington event row
insert into public.events (id, name, course_id, team_allowance_pct, individual_allowance_pct, team_best_count)
values ('kirtlington-golf-day-2026', 'Kirtlington Golf Day', 'kirtlington-18', 85, 95, 2)
on conflict (id) do nothing;
