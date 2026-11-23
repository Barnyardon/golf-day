-- Initial schema and seed data for Kirtlington Golf Day

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
  gross integer not null check (gross >= 0 and gross <= 20),
  updated_at timestamptz not null default now(),
  primary key (event_id, player_id, hole)
);

-- Enable Realtime on live scoring tables
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'scores'
  ) then
    alter publication supabase_realtime add table public.scores;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'players'
  ) then
    alter publication supabase_realtime add table public.players;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'teams'
  ) then
    alter publication supabase_realtime add table public.teams;
  end if;
end $$;

alter table public.events enable row level security;
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.scores enable row level security;

drop policy if exists "golf_day_events_all" on public.events;
drop policy if exists "golf_day_teams_all" on public.teams;
drop policy if exists "golf_day_players_all" on public.players;
drop policy if exists "golf_day_scores_all" on public.scores;

create policy "golf_day_events_all" on public.events for all using (true) with check (true);
create policy "golf_day_teams_all" on public.teams for all using (true) with check (true);
create policy "golf_day_players_all" on public.players for all using (true) with check (true);
create policy "golf_day_scores_all" on public.scores for all using (true) with check (true);

-- Seed Kirtlington Golf Day event
insert into public.events (id, name, course_id, team_allowance_pct, individual_allowance_pct, team_best_count)
values ('kirtlington-golf-day-2026', 'Kirtlington Golf Day', 'kirtlington-18', 85, 95, 2)
on conflict (id) do nothing;

-- Seed Teams
insert into public.teams (id, event_id, name, join_code) values
  ('team-1', 'kirtlington-golf-day-2026', 'Team 1', '1001'),
  ('team-2', 'kirtlington-golf-day-2026', 'Team 2', '1002'),
  ('team-3', 'kirtlington-golf-day-2026', 'Team 3', '1003')
on conflict (id) do nothing;

-- Seed Players (Matt, Al, Ian, Adam in Gerald)
insert into public.players (id, event_id, team_id, name, gender, tee_id, handicap_mode, handicap_index, in_gerald) values
  ('p-1', 'kirtlington-golf-day-2026', 'team-1', 'Matt', 'M', 'yellow', 'index', 18.0, true),
  ('p-2', 'kirtlington-golf-day-2026', 'team-1', 'Cath', 'F', 'red', 'index', 24.0, false),
  ('p-3', 'kirtlington-golf-day-2026', 'team-1', 'Viv', 'F', 'red', 'index', 24.0, false),
  ('p-4', 'kirtlington-golf-day-2026', 'team-2', 'Sonya', 'F', 'red', 'index', 24.0, false),
  ('p-5', 'kirtlington-golf-day-2026', 'team-2', 'Al', 'M', 'yellow', 'index', 18.0, true),
  ('p-6', 'kirtlington-golf-day-2026', 'team-2', 'Vicki', 'F', 'red', 'index', 24.0, false),
  ('p-7', 'kirtlington-golf-day-2026', 'team-2', 'Ian', 'M', 'yellow', 'index', 18.0, true),
  ('p-8', 'kirtlington-golf-day-2026', 'team-3', 'Adrian', 'M', 'yellow', 'index', 18.0, false),
  ('p-9', 'kirtlington-golf-day-2026', 'team-3', 'Jo', 'F', 'red', 'index', 24.0, false),
  ('p-10', 'kirtlington-golf-day-2026', 'team-3', 'Adam', 'M', 'yellow', 'index', 18.0, true)
on conflict (id) do nothing;
