-- match_h2h: past head-to-head encounters fetched once per upcoming match.
-- id is the API-Football fixture id (string).
-- for_match_id links to the upcoming match that triggered the fetch.
-- No FK to matches(id) — historical h2h fixtures predate this tournament.
CREATE TABLE IF NOT EXISTS public.match_h2h (
  id             TEXT        PRIMARY KEY,
  for_match_id   TEXT        NOT NULL,
  home_team_code TEXT        NOT NULL,
  away_team_code TEXT        NOT NULL,
  home_score     INTEGER     NULL,
  away_score     INTEGER     NULL,
  kickoff        TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS match_h2h_for_match_id_idx ON public.match_h2h (for_match_id);
