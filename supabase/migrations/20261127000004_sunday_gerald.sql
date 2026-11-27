-- Enable Gerald on sunday-test for Al, Ian, and Matt (not Butcher)

update public.players
set in_gerald = true
where id in ('sun-p-1', 'sun-p-2', 'sun-p-3');

update public.players
set in_gerald = false
where id = 'sun-p-4';
