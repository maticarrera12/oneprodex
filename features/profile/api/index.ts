import type { SupabaseClient } from "@supabase/supabase-js"
import type {
  ProfileAchievement,
  ProfileAchievementTone,
  ProfileHeroStat,
  ProfileHistoryEntry,
  ProfileHistoryPhase,
  ProfileUser,
} from "@/features/profile/types"
import type { Database } from "@/lib/supabase/database.types"

type UserRow = Database["public"]["Tables"]["users"]["Row"]
type PredictionRow = Database["public"]["Tables"]["predictions"]["Row"]

type UserAchievementJoinRow = {
  user_id: string
  achievement_id: string
  tier: 'bronze' | 'silver' | 'gold' | null
  earned_at: string
  progress_json: Record<string, unknown> | null
  achievements: {
    id: string
    name: string
    description: string | null
    type: 'progressive' | 'one_shot'
    tiers: { bronze: number; silver: number; gold: number } | null
    points: { bronze?: number; silver?: number; gold?: number; value?: number }
  }
}

const ACHIEVEMENT_ICON_MAP: Record<string, ProfileAchievement["icon"]> = {
  matador: "target",
  on_fire: "calendar",
  de_taquito: "target",
  juega_david: "star",
  acumulador: "trophy",
  arrancamos: "check",
  trajo_refuerzos: "star",
  lo_paso_al_grupo: "check",
  de_memoria: "trophy",
  llego_a_la_semi: "trophy",
  lo_veia_venir: "star",
  es_el_nine: "star",
  en_el_podio: "trophy",
  fua_el_diego: "target",
}

const ACHIEVEMENT_TONE_MAP: Record<string, ProfileAchievementTone> = {
  matador: "lime",
  on_fire: "amber",
  de_taquito: "lime",
  juega_david: "violet",
  acumulador: "lime",
  arrancamos: "lime",
  trajo_refuerzos: "amber",
  lo_paso_al_grupo: "amber",
  de_memoria: "violet",
  llego_a_la_semi: "violet",
  lo_veia_venir: "amber",
  es_el_nine: "amber",
  en_el_podio: "violet",
  fua_el_diego: "lime",
}

export function mapToProfileAchievement(row: UserAchievementJoinRow): ProfileAchievement {
  const achievement = row.achievements
  const isProgressive = achievement.type === 'progressive'
  const got = row.tier !== null

  let progress = ""
  let progressRatio = 0

  if (isProgressive && achievement.tiers) {
    const current = (row.progress_json?.current as number) ?? 0
    if (row.tier === 'gold') {
      progress = `${achievement.tiers.gold} / ${achievement.tiers.gold}`
      progressRatio = 1
    } else if (row.tier === 'silver') {
      progress = `${current} / ${achievement.tiers.gold}`
      progressRatio = current / achievement.tiers.gold
    } else {
      const nextThreshold = row.tier === null ? achievement.tiers.bronze : achievement.tiers.silver
      progress = `${current} / ${nextThreshold}`
      progressRatio = current / nextThreshold
    }
  } else {
    progress = got ? "Conseguido" : "0 / 1"
    progressRatio = got ? 1 : 0
  }

  const tierLabel = row.tier ? ` · ${row.tier.charAt(0).toUpperCase() + row.tier.slice(1)}` : ""
  const sub = achievement.description ?? achievement.name

  return {
    id: row.achievement_id,
    name: achievement.name,
    sub: sub + (got ? tierLabel : ""),
    progress,
    progressRatio: Math.min(1, Math.max(0, progressRatio)),
    got,
    icon: ACHIEVEMENT_ICON_MAP[row.achievement_id] ?? "check",
    tone: got ? (ACHIEVEMENT_TONE_MAP[row.achievement_id] ?? "lime") : "mute",
    tier: row.tier,
    totalTiers: isProgressive ? 3 : 1,
  }
}

export async function getProfileAchievements(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<ProfileAchievement[]> {
  const [catalogResult, earnedResult] = await Promise.all([
    supabase.from("achievements").select("id, name, description, type, tiers, points"),
    supabase.from("user_achievements").select("*, achievements(*)").eq("user_id", userId),
  ])

  const catalog = catalogResult.data ?? []
  const earned = (earnedResult.data ?? []) as unknown as UserAchievementJoinRow[]
  const earnedMap = new Map(earned.map((r) => [r.achievement_id, r]))

  return catalog.map((a) => {
    const userRow = earnedMap.get(a.id)
    if (userRow) return mapToProfileAchievement(userRow)

    // Not earned yet — build a locked placeholder
    const placeholder: UserAchievementJoinRow = {
      user_id: userId,
      achievement_id: a.id,
      tier: null,
      earned_at: "",
      progress_json: { current: 0 },
      achievements: a as UserAchievementJoinRow["achievements"],
    }
    return mapToProfileAchievement(placeholder)
  })
}

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
    { label: "Total puntos", value: String(user.points) },
    { label: "de 1", value: `#${user.rank}`, sub: `de ${user.rankOf}` },
    { label: "Precisión general", value: `${user.accuracy}%` },
    { label: "Aciertos seguidos", value: String(user.streak), fire: true },
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

const STAGE_TO_PHASE: Record<string, ProfileHistoryPhase> = {
  GROUP: "grupos",
  "Group Stage": "grupos",
  R32: "octavos",
  "Round of 32": "octavos",
  R16: "cuartos",
  "Round of 16": "cuartos",
  QF: "cuartos",
  "Quarter Final": "cuartos",
  SF: "semis",
  "Semi Final": "semis",
  FINAL: "final",
  Final: "final",
  THIRD: "final",
}

async function getFormLast7(supabase: SupabaseClient<Database>, userId: string): Promise<number[]> {
  const { data } = await supabase
    .from("predictions")
    .select("points, matches(kickoff)")
    .eq("user_id", userId)
    .not("points", "is", null)
    .order("kickoff", { referencedTable: "matches", ascending: false })
    .limit(7)

  if (!data || data.length === 0) return []

  return [...data].reverse().map((row) => row.points ?? 0)
}

type MatchJoinRow = {
  home_team_code: string
  away_team_code: string
  home_score: number | null
  away_score: number | null
  kickoff: string
  stage: string
  status: string
}

async function getProfileHistory(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<ProfileHistoryEntry[]> {
  const { data } = await supabase
    .from("predictions")
    .select("home_score, away_score, points, matches(home_team_code, away_team_code, home_score, away_score, kickoff, stage, status)")
    .eq("user_id", userId)
    .not("points", "is", null)
    .order("kickoff", { referencedTable: "matches", ascending: false })
    .limit(30)

  if (!data) return []

  const allCodes = [...new Set(
    data.flatMap((row) => {
      const m = row.matches as MatchJoinRow | null
      return m ? [m.home_team_code, m.away_team_code] : []
    })
  )]

  const { data: teams } = allCodes.length > 0
    ? await supabase.from("teams").select("code, name").in("code", allCodes)
    : { data: [] }

  const teamName = new Map((teams ?? []).map((t) => [t.code, t.name]))

  return data.flatMap((row) => {
    const m = row.matches as MatchJoinRow | null
    if (!m || m.status !== "FINISHED" || m.home_score === null || m.away_score === null) return []

    const predictedHome = row.home_score
    const predictedAway = row.away_score
    const actualHome = m.home_score
    const actualAway = m.away_score

    const predictedWinner = predictedHome > predictedAway ? "home" : predictedHome < predictedAway ? "away" : "draw"
    const actualWinner = actualHome > actualAway ? "home" : actualHome < actualAway ? "away" : "draw"
    const exactScore = predictedHome === actualHome && predictedAway === actualAway
    const kind = exactScore ? "exact" : predictedWinner === actualWinner ? "result" : "miss"

    const date = new Date(m.kickoff)
    const dateStr = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}`

    return [{
      date: dateStr,
      homeTeam: teamName.get(m.home_team_code) ?? m.home_team_code,
      homeFlag: m.home_team_code,
      awayTeam: teamName.get(m.away_team_code) ?? m.away_team_code,
      awayFlag: m.away_team_code,
      myPrediction: `${predictedHome} - ${predictedAway}`,
      result: `${actualHome} - ${actualAway}`,
      pts: row.points ?? 0,
      kind,
      phase: STAGE_TO_PHASE[m.stage] ?? "grupos",
    } satisfies ProfileHistoryEntry]
  })
}

export async function getProfileData(supabase: SupabaseClient<Database>, userId: string): Promise<ProfileData | null> {
  const [user, stats, achievements, formLast7, history] = await Promise.all([
    getUserProfile(supabase, userId),
    getUserStats(supabase, userId),
    getProfileAchievements(supabase, userId),
    getFormLast7(supabase, userId),
    getProfileHistory(supabase, userId),
  ])
  if (!user) return null

  const profileUser = mapUserProfile(user, stats)

  return {
    user: profileUser,
    heroStats: mapHeroStats(profileUser),
    formLast7,
    achievements,
    history,
  }
}
