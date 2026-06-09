-- Migration: achievements catalog table + 24-row seed
-- Idempotent: ON CONFLICT DO NOTHING

CREATE TABLE IF NOT EXISTS public.achievements (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NULL,
  type        TEXT NOT NULL CHECK (type IN ('progressive', 'one_shot')),
  tiers       JSONB NULL,
  points      JSONB NOT NULL
);

-- Progressive achievements (tiers = {bronze, silver, gold} thresholds; points = {bronze, silver, gold} deltas)
INSERT INTO public.achievements (id, name, description, type, tiers, points) VALUES
  ('matador',    'Matador',     'Acertá el resultado de los partidos',             'progressive', '{"bronze":1,"silver":10,"gold":25}',   '{"bronze":5,"silver":10,"gold":20}'),
  ('on_fire',    'On Fire',     'Racha de aciertos consecutivos',                  'progressive', '{"bronze":3,"silver":5,"gold":10}',    '{"bronze":10,"silver":15,"gold":25}'),
  ('de_taquito', 'De Taquito',  'Predecí el marcador exacto',                     'progressive', '{"bronze":1,"silver":5,"gold":10}',    '{"bronze":10,"silver":20,"gold":30}'),
  ('juega_david','Juega David', 'Predecí la victoria del equipo menos favorito',  'progressive', '{"bronze":1,"silver":3,"gold":5}',     '{"bronze":10,"silver":20,"gold":30}'),
  ('acumulador', 'Acumulador',  'Acumulá puntos en predicciones',                 'progressive', '{"bronze":50,"silver":150,"gold":300}', '{"bronze":5,"silver":10,"gold":15}')
ON CONFLICT (id) DO NOTHING;

-- One-shot achievements (tiers = null; points = {value: N})
INSERT INTO public.achievements (id, name, description, type, tiers, points) VALUES
  ('arrancamos',       'Arrancamos',        'Enviaste tu bracket',                                       'one_shot', NULL, '{"value":5}'),
  ('trajo_refuerzos',  'Trajo Refuerzos',   'Invitaste a alguien a tu grupo',                           'one_shot', NULL, '{"value":15}'),
  ('lo_paso_al_grupo', 'Lo Pasó al Grupo',  'Compartiste tu bracket con el grupo',                      'one_shot', NULL, '{"value":10}'),
  ('de_memoria',       'De Memoria',        'Predijiste el orden exacto de un grupo',                   'one_shot', NULL, '{"value":50}'),
  ('llego_a_la_semi',  'Llegó a la Semi',   'Acertaste los 4 semifinalistas',                           'one_shot', NULL, '{"value":40}'),
  ('lo_veia_venir',    'Lo Veía Venir',     'Predijiste al campeón del torneo',                         'one_shot', NULL, '{"value":30}'),
  ('es_el_nine',       'Es el Nine',        'Predijiste al goleador del torneo',                        'one_shot', NULL, '{"value":30}'),
  ('en_el_podio',      'En el Podio',       'Estás en el top 3 de un grupo con 5+ miembros',           'one_shot', NULL, '{"value":20}'),
  ('fua_el_diego',     'Fua el Diego',      '70%+ de precisión cuando terminan todos los partidos',    'one_shot', NULL, '{"value":50}')
ON CONFLICT (id) DO NOTHING;
