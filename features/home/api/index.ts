import type { SupabaseClient } from "@supabase/supabase-js"
import { getActiveGroupId, getGroupInfo, getGroupLeaderboard } from "@/features/groups/api"
import type { ActivityItem, GroupInfo } from "@/features/groups/types"
import { getLiveMatches, getUpcomingMatches } from "@/features/matches/api"
import type { Match } from "@/features/matches/types"
import { getUserStats } from "@/features/profile/api"
import type { RankingEntry } from "@/features/rankings/types"
import type { Database } from "@/lib/supabase/database.types"

type PredictionRow = Pick<Database["public"]["Tables"]["predictions"]["Row"], "match_id" | "home_score" | "away_score">

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

async function mergeUpcomingPredictions(
  supabase: SupabaseClient<Database>,
  userId: string,
  upcomingMatches: Match[]
): Promise<Match[]> {
  if (upcomingMatches.length === 0) return upcomingMatches

  const matchIds = upcomingMatches.map((match) => match.id)
  const { data, error } = await supabase
    .from("predictions")
    .select("match_id,home_score,away_score")
    .eq("user_id", userId)
    .in("match_id", matchIds)

  if (error || !data) return upcomingMatches

  const predictionByMatchId = new Map(
    (data as PredictionRow[]).map((prediction) => [
      prediction.match_id,
      { hs: prediction.home_score, as: prediction.away_score },
    ] as const)
  )

  return upcomingMatches.map((match) => ({
    ...match,
    pred: predictionByMatchId.get(match.id) ?? match.pred,
  }))
}

export async function getHomeData(supabase: SupabaseClient<Database>, userId: string): Promise<HomeData> {
  const [liveMatches, upcomingBase, groupId, userStats] = await Promise.all([
    getLiveMatches(supabase),
    getUpcomingMatches(supabase),
    getActiveGroupId(supabase, userId),
    getUserStats(supabase, userId),
  ])
  const upcomingMatches = await mergeUpcomingPredictions(supabase, userId, upcomingBase)

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
