-- Migration: user_achievements table
-- Composite PK (user_id, achievement_id). Depends on TASK-01 (achievements table).

CREATE TABLE IF NOT EXISTS public.user_achievements (
  user_id        UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_id TEXT        NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  tier           TEXT        NULL CHECK (tier IN ('bronze', 'silver', 'gold')),
  earned_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  progress_json  JSONB       NULL,
  PRIMARY KEY (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS user_achievements_user_id_idx ON public.user_achievements (user_id);
