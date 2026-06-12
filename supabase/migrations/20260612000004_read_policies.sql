-- Read policies for social features and public sports data.
-- Root cause of two production bugs: new tables had RLS enabled with NO
-- policies (server reads with the user-scoped client returned 0 rows):
--   - match_lineups invisible in the app (lineups tab showed empty state)
--   - users unreadable for other members (consensus dropped every friend)

-- Public sports data: readable by everyone (anon + authenticated)
alter table public.match_lineups enable row level security;
create policy "read lineups" on public.match_lineups
  for select to anon, authenticated using (true);

alter table public.match_predictions enable row level security;
create policy "read match predictions" on public.match_predictions
  for select to anon, authenticated using (true);

alter table public.match_h2h enable row level security;
create policy "read h2h" on public.match_h2h
  for select to anon, authenticated using (true);

-- Social: authenticated users can see each other's public identity and game
-- data (consensus, friend profiles, leaderboards are built on this).
create policy "read user profiles" on public.users
  for select to authenticated using (true);

create policy "read predictions of others" on public.predictions
  for select to authenticated using (true);

create policy "read bracket picks of others" on public.bracket_picks
  for select to authenticated using (true);

create policy "read achievements of others" on public.user_achievements
  for select to authenticated using (true);
