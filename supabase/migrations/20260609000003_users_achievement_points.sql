-- Migration: add achievement_points to users table + update get_group_leaderboard RPC

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS achievement_points INT NOT NULL DEFAULT 0;

-- Updated RPC: total_pts = SUM(prediction points) + users.achievement_points
CREATE OR REPLACE FUNCTION public.get_group_leaderboard(p_group_id uuid)
  RETURNS TABLE(user_id uuid, handle text, display_name text, avatar_url text, total_pts bigint)
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
  SELECT u.id, u.handle, u.display_name, u.avatar_url,
         COALESCE(SUM(p.points), 0) + COALESCE(u.achievement_points, 0) AS total_pts
  FROM group_members gm
  JOIN users u ON u.id = gm.user_id
  LEFT JOIN predictions p ON p.user_id = gm.user_id
  WHERE gm.group_id = p_group_id
  GROUP BY u.id, u.handle, u.display_name, u.avatar_url, u.achievement_points
  ORDER BY total_pts DESC
$function$;
