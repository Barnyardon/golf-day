-- Seed isolated Sunday foursome test event at Kirtlington

insert into public.events (id, name, event_date, course_id, team_allowance_pct, individual_allowance_pct, team_best_count)
values ('sunday-test', 'Sunday Foursome Test', '2026-11-29', 'kirtlington-18', 85, 95, 2)
on conflict (id) do update set
  name = excluded.name,
  event_date = excluded.event_date;

insert into public.teams (id, event_id, name, join_code) values
  ('sun-team-1', 'sunday-test', 'Sunday Foursome', '2001')
on conflict (id) do nothing;

insert into public.players (id, event_id, team_id, name, gender, tee_id, handicap_mode, handicap_index, in_gerald, in_geraldine) values
  ('sun-p-1', 'sunday-test', 'sun-team-1', 'Matt', 'M', 'yellow', 'index', 19.8, true, false),
  ('sun-p-2', 'sunday-test', 'sun-team-1', 'Ian', 'M', 'yellow', 'index', 29.0, true, false),
  ('sun-p-3', 'sunday-test', 'sun-team-1', 'Al', 'M', 'yellow', 'index', 18.2, true, false),
  ('sun-p-4', 'sunday-test', 'sun-team-1', 'Butcher', 'M', 'yellow', 'index', 18.0, true, false)
on conflict (id) do update set
  name = excluded.name,
  handicap_index = excluded.handicap_index,
  in_gerald = excluded.in_gerald;
