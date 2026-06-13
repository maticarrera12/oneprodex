-- Enrich H2H rows with display metadata from API-Football fixture payload.
ALTER TABLE public.match_h2h
  ADD COLUMN IF NOT EXISTS home_team_name TEXT NULL,
  ADD COLUMN IF NOT EXISTS away_team_name TEXT NULL,
  ADD COLUMN IF NOT EXISTS league_name TEXT NULL,
  ADD COLUMN IF NOT EXISTS season INTEGER NULL,
  ADD COLUMN IF NOT EXISTS round TEXT NULL,
  ADD COLUMN IF NOT EXISTS venue TEXT NULL;
