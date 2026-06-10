-- Onboarding completion is now tied to tournament awards completion.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS awards_at TIMESTAMPTZ NULL;

-- Backfill existing users that already completed all awards.
UPDATE public.users AS u
SET awards_at = COALESCE(u.awards_at, u.bracket_submitted_at, NOW())
FROM public.tournament_predictions AS tp
WHERE tp.user_id = u.id
  AND tp.top_scorer_api_id IS NOT NULL
  AND tp.best_player_api_id IS NOT NULL
  AND tp.best_young_player_api_id IS NOT NULL
  AND u.awards_at IS NULL;
