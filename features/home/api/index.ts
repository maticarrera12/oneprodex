import type { SupabaseClient } from "@supabase/supabase-js"
import { getActiveGroupId, getGroupInfo, getGroupLeaderboard, getUserGroups } from "@/features/groups/api"
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
  allGroups: GroupInfo[]
  top3: RankingEntry[]
  you: RankingEntry | undefined
  activity: ActivityItem[]
  stats: {
    pts: number
    acc: number
    streak: number
    ptsDelta: number
    accDelta: number
    streakDelta: number
  }
}

async function getStatDeltas(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<{ ptsDelta: number; accDelta: number; streak: number; streakDelta: number }> {
  const { data } = await supabase
    .from("predictions")
    .select("points")
    .eq("user_id", userId)
    .not("points", "is", null)
    .order("created_at", { ascending: false })
    .limit(20)

  if (!data || data.length === 0) return { ptsDelta: 0, accDelta: 0, streak: 0, streakDelta: 0 }

  // Streak: consecutive correct predictions from most recent
  let streak = 0
  for (const row of data) {
    if ((row.points ?? 0) > 0) streak++
    else break
  }

  // streakDelta: +1 if last was correct, -1 if it broke the streak
  const streakDelta = (data[0].points ?? 0) > 0 ? 1 : -1

  if (data.length < 2) return { ptsDelta: 0, accDelta: 0, streak, streakDelta }

  const half = Math.ceil(data.length / 2)
  const recent = data.slice(0, half)
  const previous = data.slice(half)

  const avgRecent = recent.reduce((s, r) => s + (r.points ?? 0), 0) / recent.length
  const avgPrevious = previous.reduce((s, r) => s + (r.points ?? 0), 0) / previous.length
  const ptsDelta = Math.round((avgRecent - avgPrevious) * 10) / 10

  const hitRecent = recent.filter((r) => (r.points ?? 0) > 0).length / recent.length
  const hitPrevious = previous.filter((r) => (r.points ?? 0) > 0).length / previous.length
  const accDelta = Math.round((hitRecent - hitPrevious) * 100)

  return { ptsDelta, accDelta, streak, streakDelta }
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

export async function getHomeData(supabase: SupabaseClient<Database>, userId: string, preferredGroupId?: string): Promise<HomeData> {
  const [liveMatches, upcomingBase, allGroups, userStats, deltas] = await Promise.all([
    getLiveMatches(supabase),
    getUpcomingMatches(supabase),
    getUserGroups(supabase, userId),
    getUserStats(supabase, userId),
    getStatDeltas(supabase, userId),
  ])

  const groupId = preferredGroupId && allGroups.some((g) => g.id === preferredGroupId)
    ? preferredGroupId
    : allGroups[0]?.id ?? null
  const upcomingMatches = await mergeUpcomingPredictions(supabase, userId, upcomingBase)

  if (!groupId) {
    return {
      liveMatches,
      upcomingMatches,
      groupInfo: null,
      allGroups,
      top3: [],
      you: undefined,
      activity: [],
      stats: {
        pts: userStats.totalPts,
        acc: Math.round((userStats.accuracy ?? 0) * 100),
        ...deltas,
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
    allGroups,
    top3: leaderboard.slice(0, 3),
    you: leaderboard.find((entry) => entry.isYou),
    activity: [],
    stats: {
      pts: userStats.totalPts,
      acc: Math.round((userStats.accuracy ?? 0) * 100),
      ...deltas,
    },
  }
}
