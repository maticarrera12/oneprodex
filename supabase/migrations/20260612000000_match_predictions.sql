-- match_predictions: immutable pre-kickoff snapshot for juega_david evaluation.
-- INSERT ... ON CONFLICT DO NOTHING enforces the immutability invariant.
CREATE TABLE IF NOT EXISTS public.match_predictions (
  match_id   TEXT        PRIMARY KEY REFERENCES public.matches(id) ON DELETE CASCADE,
  home_pct   SMALLINT    NOT NULL CHECK (home_pct BETWEEN 0 AND 100),
  draw_pct   SMALLINT    NOT NULL CHECK (draw_pct BETWEEN 0 AND 100),
  away_pct   SMALLINT    NOT NULL CHECK (away_pct BETWEEN 0 AND 100),
  advice     TEXT        NULL,
  synced_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
