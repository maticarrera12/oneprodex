create table public.group_picks (
  user_id uuid not null references public.users(id) on delete cascade,
  group_code char(1) not null check (group_code in ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L')),
  position smallint not null check (position between 1 and 4),
  team_code text not null references public.teams(code),
  advances_as_third boolean not null default false,
  primary key (user_id, group_code, position),
  unique (user_id, group_code, team_code)
);
