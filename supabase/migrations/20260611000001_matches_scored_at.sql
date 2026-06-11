-- Tracks when a finished match was last scored by /api/sync/events.
-- NULL = never scored (always picked up by the cron). Matches with a recent
-- kickoff keep being re-scored for late event corrections; older scored
-- matches are skipped so the cron cost stays flat across the tournament.

alter table public.matches
  add column if not exists scored_at timestamptz;
