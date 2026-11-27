-- Split Sunday Foursome Test into Team A (Al, Ian) and Team B (Butcher, Matt)
-- Combined Stableford (both players count, 95% CH matching Individual Stableford)

update public.events
set team_allowance_pct = 95,
    individual_allowance_pct = 95,
    team_best_count = 2
where id = 'sunday-test';

insert into public.teams (id, event_id, name, join_code) values
  ('sun-team-a', 'sunday-test', 'Team A', '2001'),
  ('sun-team-b', 'sunday-test', 'Team B', '2002')
on conflict (id) do update set name = excluded.name;

update public.players set team_id = 'sun-team-a' where id in ('sun-p-2', 'sun-p-3');
update public.players set team_id = 'sun-team-b' where id in ('sun-p-1', 'sun-p-4');

delete from public.teams where id = 'sun-team-1';
