-- Accent-insensitive player search.
-- Adds a normalized generated column so "mbappe" matches "Mbappé".
-- Keep the normalization in sync with normalizeSearchText (lib/search.ts).

create extension if not exists unaccent;

-- unaccent() is STABLE (dictionary lookup), so it cannot be used directly in
-- a generated column. The wrapper pins the dictionary and search_path, which
-- makes it safe to declare IMMUTABLE.
create or replace function public.immutable_unaccent(value text)
returns text
language sql
immutable
parallel safe
set search_path = extensions, public, pg_catalog
as $$
  select unaccent('unaccent'::regdictionary, value)
$$;

alter table public.players
  add column if not exists name_search text
  generated always as (lower(public.immutable_unaccent(name))) stored;
