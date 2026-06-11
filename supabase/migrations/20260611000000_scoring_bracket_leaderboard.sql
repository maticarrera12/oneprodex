-- Include bracket_picks.points in group leaderboard total

CREATE OR REPLACE FUNCTION public.get_group_leaderboard(p_group_id uuid)
  RETURNS TABLE(user_id uuid, handle text, display_name text, avatar_url text, total_pts bigint, correct_count bigint)
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
  SELECT u.id, u.handle, u.display_name, u.avatar_url,
         COALESCE(pred.prediction_pts, 0)
           + COALESCE(bracket.bracket_pts, 0)
           + COALESCE(u.achievement_points, 0) AS total_pts,
         COALESCE(pred.correct_count, 0) + COALESCE(bracket.bracket_hits, 0) AS correct_count
  FROM group_members gm
  JOIN users u ON u.id = gm.user_id
  LEFT JOIN LATERAL (
    SELECT COALESCE(SUM(p.points), 0) AS prediction_pts,
           COUNT(CASE WHEN p.points > 0 THEN 1 END) AS correct_count
    FROM predictions p
    WHERE p.user_id = gm.user_id
  ) pred ON true
  LEFT JOIN LATERAL (
    SELECT COALESCE(SUM(bp.points), 0) AS bracket_pts,
           COUNT(CASE WHEN bp.points > 0 THEN 1 END) AS bracket_hits
    FROM bracket_picks bp
    WHERE bp.user_id = gm.user_id
  ) bracket ON true
  WHERE gm.group_id = p_group_id
  ORDER BY total_pts DESC
$function$;
