-- Switch sunday-test to straight Individual Stableford (no Team Better Ball)

update public.events
set team_best_count = 0
where id = 'sunday-test';

update public.players
set in_gerald = false
where event_id = 'sunday-test';
