-- Add Geraldine competition flag (same as Gerald, for selected women)

alter table public.players
  add column if not exists in_geraldine boolean not null default false;

-- Default all women in the current roster into Geraldine (organiser can toggle any player)
update public.players
set in_geraldine = true
where gender = 'F';
