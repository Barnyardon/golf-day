-- Switch all Sunday Foursome Test players to Kirtlington White (Medal) tees

update public.players
set tee_id = 'medal'
where event_id = 'sunday-test';
