-- Per-match scoreline predictions for the REAL knockout bracket. The bracket
-- tree advances by real results; these picks only earn RESULT points (exact /
-- correct outcome) scored against the real scoreline.
CREATE TABLE IF NOT EXISTS public.knockout_score_picks (
  user_id    UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  match_id   TEXT        NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  home_score SMALLINT    NOT NULL,
  away_score SMALLINT    NOT NULL,
  points     SMALLINT    NULL DEFAULT NULL,
  locked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, match_id)
);

ALTER TABLE public.knockout_score_picks ENABLE ROW LEVEL SECURITY;

-- Mirror predictions/bracket_picks: own write + authenticated read of others.
CREATE POLICY "manage own knockout score picks"
  ON public.knockout_score_picks FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "read knockout score picks of others"
  ON public.knockout_score_picks FOR SELECT TO authenticated USING (true);
