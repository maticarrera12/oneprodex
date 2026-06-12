-- match_lineups: pre-kickoff lineup snapshot for Alineaciones tab.
-- UPSERTed (not immutable) — lineups may arrive partially hours before kickoff;
-- later cron calls fill in remaining players. Freeze enforced by query gate (status=UPCOMING).
-- No FK to players(api_id) — players table may lag lineup API delivery.
CREATE TABLE IF NOT EXISTS public.match_lineups (
  match_id       TEXT        NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  team_code      TEXT        NOT NULL,
  player_api_id  INTEGER     NOT NULL,
  name           TEXT        NOT NULL,
  number         SMALLINT    NULL,
  position       TEXT        NULL,
  grid           TEXT        NULL,
  is_substitute  BOOLEAN     NOT NULL DEFAULT false,
  synced_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (match_id, team_code, player_api_id)
);
CREATE INDEX IF NOT EXISTS match_lineups_match_id_idx ON public.match_lineups (match_id);
