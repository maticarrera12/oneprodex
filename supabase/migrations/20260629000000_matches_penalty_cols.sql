-- Add penalty shoot-out score columns to matches.
-- Used for knockout matches that are decided by penalties after a draw.
-- NULL means the match was not decided by penalties (or data not yet available).

ALTER TABLE public.matches
  ADD COLUMN home_pen_score SMALLINT NULL,
  ADD COLUMN away_pen_score SMALLINT NULL;
