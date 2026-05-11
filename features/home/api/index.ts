import type { SupabaseClient } from "@supabase/supabase-js"
import { getActiveGroupId, getGroupInfo, getGroupLeaderboard } from "@/features/groups/api"
import type { ActivityItem, GroupInfo } from "@/features/groups/types"
import { getLiveMatches, getUpcomingMatches } from "@/features/matches/api"
import type { Match } from "@/features/matches/types"
import { getUserStats } from "@/features/profile/api"
import type { RankingEntry } from "@/features/rankings/types"
import type { Database } from "@/lib/supabase/database.types"

export type HomeData = {
  liveMatches: Match[]
  upcomingMatches: Match[]
  groupInfo: GroupInfo | null
  top3: RankingEntry[]
  you: RankingEntry | undefined
  activity: ActivityItem[]
  stats: {
    pts: number
    acc: number
    streak: number
  }
}

export async function getHomeData(supabase: SupabaseClient<Database>, userId: string): Promise<HomeData> {
  const [liveMatches, upcomingMatches, groupId, userStats] = await Promise.all([
    getLiveMatches(supabase),
    getUpcomingMatches(supabase),
    getActiveGroupId(supabase, userId),
    getUserStats(supabase, userId),
  ])

  if (!groupId) {
    return {
      liveMatches,
      upcomingMatches,
      groupInfo: null,
      top3: [],
      you: undefined,
      activity: [],
      stats: {
        pts: userStats.totalPts,
        acc: Math.round((userStats.accuracy ?? 0) * 100),
        streak: 0,
      },
    }
  }

  const [groupInfo, leaderboard] = await Promise.all([
    getGroupInfo(supabase, groupId),
    getGroupLeaderboard(supabase, groupId, userId),
  ])

  return {
    liveMatches,
    upcomingMatches,
    groupInfo,
    top3: leaderboard.slice(0, 3),
    you: leaderboard.find((entry) => entry.isYou),
    activity: [],
    stats: {
      pts: userStats.totalPts,
      acc: Math.round((userStats.accuracy ?? 0) * 100),
      streak: 0,
    },
  }
}
