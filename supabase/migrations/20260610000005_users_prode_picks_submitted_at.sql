-- Tracks when a prode-mode user chooses to move past group-stage score picks.
-- Incomplete score picks then continue to awards; complete 72/72 score picks continue to bracket.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS prode_picks_submitted_at TIMESTAMPTZ NULL;
