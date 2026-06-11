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
import { AR_TIME_ZONE } from "@/features/matches/utils/kickoff"

type UserRow = Database["public"]["Tables"]["users"]["Row"]
type PredictionRow = Database["public"]["Tables"]["predictions"]["Row"]
type ChampionPick = {
  code: string
  name: string | null
  logo: string | null
}

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

  const tierLabel = (isProgressive && row.tier) ? ` · ${row.tier.charAt(0).toUpperCase() + row.tier.slice(1)}` : ""
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
    tier: isProgressive ? row.tier : null,
    totalTiers: isProgressive ? 3 : 1,
  }
}

export async function getProfileAchievements(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<ProfileAchievement[]> {
  const [catalogResult, earnedResult] = await Promise.all([
    supabase.from("achievements").select("id, name, description, type, tiers, points"),
    supabase
      .from("user_achievements")
      .select("achievement_id, tier, earned_at, progress_json")
      .eq("user_id", userId),
  ])

  if (catalogResult.error) {
    console.error("[profile] failed to load achievements catalog:", catalogResult.error)
    return []
  }

  if (earnedResult.error) {
    console.error("[profile] failed to load user achievements:", earnedResult.error)
  }

  const catalog = catalogResult.data
const earnedMap = new Map(
    (earnedResult.data ?? []).map((r) => [r.achievement_id, r])
  )

  return catalog.map((a) => {
    const userRow = earnedMap.get(a.id)
    const joinRow: UserAchievementJoinRow = {
      user_id: userId,
      achievement_id: a.id,
      tier: (userRow?.tier as UserAchievementJoinRow["tier"]) ?? null,
      earned_at: userRow?.earned_at ?? "",
      progress_json: (userRow?.progress_json as Record<string, unknown>) ?? { current: 0 },
      achievements: a as UserAchievementJoinRow["achievements"],
    }
    return mapToProfileAchievement(joinRow)
  })
}

export type UserStats = {
  totalPts: number
  predictionPts: number
  achievementPts: number
  predictionCount: number
  accuracy: number | null
  streak: number
}

export type ProfileData = {
  user: ProfileUser
  heroStats: ProfileHeroStat[]
  formLast7: number[]
  achievements: ProfileAchievement[]
  history: ProfileHistoryEntry[]
}

export function mapUserProfile(user: UserRow, stats: UserStats, championPick: ChampionPick | null): ProfileUser {
  return {
    name: user.display_name,
    handle: user.handle,
    joinedAt: user.created_at
      ? `Joined ${new Date(user.created_at).toLocaleDateString("es-AR", { timeZone: AR_TIME_ZONE })}`
      : "Joined",
    level: 1,
    levelTitle: "Pundit",
    nextLevelTitle: "Tactician",
    levelCurrent: stats.totalPts,
    levelTarget: Math.max(stats.totalPts + 50, 100),
    championPick: championPick?.code ?? null,
    championPickName: championPick?.name ?? null,
    championPickLogo: championPick?.logo ?? null,
    points: stats.totalPts,
    rank: 1,
    rankOf: 1,
    accuracy: Math.round((stats.accuracy ?? 0) * 100),
    streak: stats.streak,
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
  const [predictionsResult, bracketResult, userResult] = await Promise.all([
    supabase.from("predictions").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("bracket_picks").select("points").eq("user_id", userId),
    supabase.from("users").select("achievement_points").eq("id", userId).maybeSingle(),
  ])
  const data = predictionsResult.data ?? []
  const bracketData = bracketResult.data ?? []
  const achievementPts = userResult.data?.achievement_points ?? 0
  const bracketPts = bracketData.reduce((sum, row) => sum + (row.points ?? 0), 0)

  if (predictionsResult.error || data.length === 0) {
    return {
      totalPts: achievementPts + bracketPts,
      predictionPts: 0,
      achievementPts,
      predictionCount: 0,
      accuracy: null,
      streak: 0,
    }
  }

  const predictionPts = data.reduce((sum, row) => sum + (row.points ?? 0), 0)
  const scoredPredictions = data.filter((row) => row.points !== null)
  const hitPredictions = scoredPredictions.filter((row) => (row.points ?? 0) > 0)
  const accuracy =
    scoredPredictions.length > 0 ? hitPredictions.length / scoredPredictions.length : null
  let streak = 0
  for (const row of scoredPredictions) {
    if ((row.points ?? 0) <= 0) break
    streak++
  }

  return {
    totalPts: predictionPts + achievementPts + bracketPts,
    predictionPts,
    achievementPts,
    predictionCount: data.length,
    accuracy,
    streak,
  }
}

async function getChampionPick(supabase: SupabaseClient<Database>, userId: string): Promise<ChampionPick | null> {
  const { data: pick } = await supabase
    .from("bracket_picks")
    .select("team_code")
    .eq("user_id", userId)
    .eq("slot", "FINAL")
    .maybeSingle()

  if (!pick?.team_code) return null

  const { data: team } = await supabase
    .from("teams")
    .select("code,name,logo")
    .eq("code", pick.team_code)
    .maybeSingle()

  return {
    code: team?.code ?? pick.team_code,
    name: team?.name ?? pick.team_code,
    logo: team?.logo ?? null,
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
  const [user, stats, achievements, formLast7, history, championPick] = await Promise.all([
    getUserProfile(supabase, userId),
    getUserStats(supabase, userId),
    getProfileAchievements(supabase, userId),
    getFormLast7(supabase, userId),
    getProfileHistory(supabase, userId),
    getChampionPick(supabase, userId),
  ])
  if (!user) return null

  const profileUser = mapUserProfile(user, stats, championPick)

  return {
    user: profileUser,
    heroStats: mapHeroStats(profileUser),
    formLast7,
    achievements,
    history,
  }
}
