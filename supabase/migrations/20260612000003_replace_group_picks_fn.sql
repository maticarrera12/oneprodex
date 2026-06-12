-- Atomic replace of a user's derived group_picks.
-- Fixes two failure modes of writing from the app in separate statements:
--   1) upsert by (user_id, group_code, position) cannot reorder teams because
--      of the second unique constraint (user_id, group_code, team_code);
--   2) delete + insert as two HTTP calls races with concurrent autosaves.
-- One function = one transaction = both problems gone.
create or replace function public.replace_group_picks(p_user_id uuid, p_rows jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.group_picks
  where user_id = p_user_id
    and group_code in (
      select distinct r->>'group_code' from jsonb_array_elements(p_rows) r
    );

  insert into public.group_picks (user_id, group_code, position, team_code, advances_as_third)
  select
    p_user_id,
    r->>'group_code',
    (r->>'position')::int,
    r->>'team_code',
    coalesce((r->>'advances_as_third')::boolean, false)
  from jsonb_array_elements(p_rows) r;
end;
$$;
