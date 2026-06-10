-- Migration: add correct_count to get_group_leaderboard RPC
-- correct_count = predictions where points > 0 (real hits, not estimated from total_pts)

CREATE OR REPLACE FUNCTION public.get_group_leaderboard(p_group_id uuid)
  RETURNS TABLE(user_id uuid, handle text, display_name text, avatar_url text, total_pts bigint, correct_count bigint)
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
  SELECT u.id, u.handle, u.display_name, u.avatar_url,
         COALESCE(SUM(p.points), 0) + COALESCE(u.achievement_points, 0) AS total_pts,
         COUNT(CASE WHEN p.points > 0 THEN 1 END)                        AS correct_count
  FROM group_members gm
  JOIN users u ON u.id = gm.user_id
  LEFT JOIN predictions p ON p.user_id = gm.user_id
  WHERE gm.group_id = p_group_id
  GROUP BY u.id, u.handle, u.display_name, u.avatar_url, u.achievement_points
  ORDER BY total_pts DESC
$function$;
