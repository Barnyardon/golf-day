-- Switch sunday-test team competition to Pairs Better Ball (best 1 of 2 at 85% CH)
-- Individual Stableford (Overall & Gerald) remains at 95% CH

update public.events
set team_allowance_pct = 85,
    individual_allowance_pct = 95,
    team_best_count = 1
where id = 'sunday-test';
