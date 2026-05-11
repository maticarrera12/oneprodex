import type { SupabaseClient } from "@supabase/supabase-js"
import type {
  ProfileAchievement,
  ProfileHeroStat,
  ProfileHistoryEntry,
  ProfileUser,
} from "@/features/profile/types"
import type { Database } from "@/lib/supabase/database.types"

type UserRow = Database["public"]["Tables"]["users"]["Row"]
type PredictionRow = Database["public"]["Tables"]["predictions"]["Row"]

export type UserStats = {
  totalPts: number
  predictionCount: number
  accuracy: number | null
}

export type ProfileData = {
  user: ProfileUser
  heroStats: ProfileHeroStat[]
  formLast7: number[]
  achievements: ProfileAchievement[]
  history: ProfileHistoryEntry[]
}

function mapUserProfile(user: UserRow, stats: UserStats): ProfileUser {
  return {
    name: user.display_name,
    handle: user.handle,
    joinedAt: user.created_at ? `Joined ${new Date(user.created_at).toLocaleDateString("es-AR")}` : "Joined",
    level: 1,
    levelTitle: "Pundit",
    nextLevelTitle: "Tactician",
    levelCurrent: stats.totalPts,
    levelTarget: Math.max(stats.totalPts + 50, 100),
    championPick: "ARG",
    points: stats.totalPts,
    rank: 1,
    rankOf: 1,
    accuracy: Math.round((stats.accuracy ?? 0) * 100),
    streak: 0,
  }
}

function mapHeroStats(user: ProfileUser): ProfileHeroStat[] {
  return [
    { label: "Points", value: String(user.points) },
    { label: "Rank", value: `#${user.rank}`, sub: `of ${user.rankOf}` },
    { label: "Accuracy", value: `${user.accuracy}%` },
    { label: "Streak", value: String(user.streak), fire: true },
  ]
}

export async function getUserProfile(supabase: SupabaseClient<Database>, userId: string): Promise<UserRow | null> {
  const { data, error } = await supabase.from("users").select("*").eq("id", userId).maybeSingle()
  if (error || !data) return null
  return data
}

export async function getUserStats(supabase: SupabaseClient<Database>, userId: string): Promise<UserStats> {
  const { data, error } = await supabase.from("predictions").select("*").eq("user_id", userId)
  if (error || !data || data.length === 0) {
    return { totalPts: 0, predictionCount: 0, accuracy: null }
  }

  const totalPts = data.reduce((sum, row) => sum + (row.points ?? 0), 0)
  const scoredPredictions = data.filter((row) => row.points !== null)
  const hitPredictions = scoredPredictions.filter((row) => (row.points ?? 0) > 0)
  const accuracy =
    scoredPredictions.length > 0 ? hitPredictions.length / scoredPredictions.length : null

  return {
    totalPts,
    predictionCount: data.length,
    accuracy,
  }
}

export async function getProfileData(supabase: SupabaseClient<Database>, userId: string): Promise<ProfileData | null> {
  const [user, stats] = await Promise.all([getUserProfile(supabase, userId), getUserStats(supabase, userId)])
  if (!user) return null

  const profileUser = mapUserProfile(user, stats)

  return {
    user: profileUser,
    heroStats: mapHeroStats(profileUser),
    formLast7: [],
    achievements: [],
    history: [],
  }
}
