import type { SupabaseClient } from "@supabase/supabase-js"
import type { Match } from "@/features/matches/types"
import type { Database } from "@/lib/supabase/database.types"
import { applyWorldCupSeasonKickoffFilter } from "@/lib/world-cup/season"

type MatchRow = Database["public"]["Tables"]["matches"]["Row"]
type PredictionRow = Database["public"]["Tables"]["predictions"]["Row"]
type TeamLookupRow = Pick<Database["public"]["Tables"]["teams"]["Row"], "api_id" | "code" | "logo">
const SIMULATED_NOW = process.env.SIMULATED_NOW
const SIMULATED_MATCH_WINDOW_MINUTES = 130

function normalizeMatchStatus(status: string): Match["status"] {
  if (status === "LIVE") return "LIVE"
  if (status === "FINISHED") return "FINISHED"
  return "UPCOMING"
}

function getReferenceNow(): Date | null {
  if (!SIMULATED_NOW) return null
  const parsed = new Date(SIMULATED_NOW)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function deriveStatusFromKickoff(row: MatchRow, now: Date | null): Match["status"] {
  if (!now) return normalizeMatchStatus(row.status)

  const kickoff = new Date(row.kickoff)
  if (Number.isNaN(kickoff.getTime())) return normalizeMatchStatus(row.status)

  if (now.getTime() < kickoff.getTime()) return "UPCOMING"

  const liveEndsAt = kickoff.getTime() + SIMULATED_MATCH_WINDOW_MINUTES * 60_000
  if (now.getTime() <= liveEndsAt) return "LIVE"

  return "FINISHED"
}

function deriveMinute(row: MatchRow, status: Match["status"], now: Date | null): number | null {
  if (!now || status !== "LIVE") return row.minute

  const kickoff = new Date(row.kickoff)
  if (Number.isNaN(kickoff.getTime())) return row.minute

  const elapsed = Math.floor((now.getTime() - kickoff.getTime()) / 60_000)
  if (elapsed < 0) return 0
  if (elapsed > SIMULATED_MATCH_WINDOW_MINUTES) return SIMULATED_MATCH_WINDOW_MINUTES
  return elapsed
}

function normalizeTeamCode(code: string): string {
  return code.trim().toUpperCase()
}

function normalizeLogoUrl(logo: string | null): string | null {
  if (!logo) return null
  const trimmed = logo.trim()
  if (trimmed.startsWith("https://")) return trimmed
  if (trimmed.startsWith("http://")) return `https://${trimmed.slice("http://".length)}`
  if (trimmed.startsWith("//")) return `https:${trimmed}`
  return trimmed
}

async function getTeamsLookup(
  supabase: SupabaseClient<Database>
): Promise<{ byCode: Map<string, TeamLookupRow>; byApiId: Map<string, TeamLookupRow> }> {
  const { data, error } = await supabase.from("teams").select("api_id,code,logo")
  if (error || !data) {
    return { byCode: new Map(), byApiId: new Map() }
  }

  const byCode = new Map(data.map((team) => [normalizeTeamCode(team.code), team] as const))
  const byApiId = new Map(
    data
      .filter((team): team is TeamLookupRow & { api_id: number } => typeof team.api_id === "number")
      .map((team) => [String(team.api_id), team] as const)
  )

  return { byCode, byApiId }
}

function resolveTeam(
  value: string,
  lookup: { byCode: Map<string, TeamLookupRow>; byApiId: Map<string, TeamLookupRow> }
): TeamLookupRow | undefined {
  const raw = value.trim()
  const normalized = normalizeTeamCode(raw)
  return lookup.byCode.get(normalized) ?? lookup.byApiId.get(raw)
}

function mapMatchRow(
  row: MatchRow,
  prediction: PredictionRow | null = null,
  now: Date | null = null,
  lookup: { byCode: Map<string, TeamLookupRow>; byApiId: Map<string, TeamLookupRow> } = {
    byCode: new Map(),
    byApiId: new Map(),
  }
): Match {
  const status = deriveStatusFromKickoff(row, now)
  const homeTeam = resolveTeam(row.home_team_code, lookup)
  const awayTeam = resolveTeam(row.away_team_code, lookup)
  return {
    id: row.id,
    home: homeTeam?.code ?? normalizeTeamCode(row.home_team_code),
    away: awayTeam?.code ?? normalizeTeamCode(row.away_team_code),
    homeLogo: normalizeLogoUrl(homeTeam?.logo ?? null),
    awayLogo: normalizeLogoUrl(awayTeam?.logo ?? null),
    hs: row.home_score,
    as: row.away_score,
    pred: prediction
      ? {
          hs: prediction.home_score,
          as: prediction.away_score,
        }
      : null,
    status,
    minute: deriveMinute(row, status, now),
    kickoff: row.kickoff,
    stage: row.stage,
  }
}

function matchesTable(supabase: SupabaseClient<Database>) {
  return applyWorldCupSeasonKickoffFilter(supabase.from("matches").select("*"))
}

export async function getMatches(supabase: SupabaseClient<Database>): Promise<Match[]> {
  const { data, error } = await matchesTable(supabase).order("kickoff", { ascending: true })
  if (error || !data) return []
  const now = getReferenceNow()
  const lookup = await getTeamsLookup(supabase)
  return data.map((row) => mapMatchRow(row, null, now, lookup))
}

export async function getLiveMatches(supabase: SupabaseClient<Database>): Promise<Match[]> {
  const { data, error } = await applyWorldCupSeasonKickoffFilter(supabase.from("matches").select("*"))
    .eq("status", "LIVE")
    .order("kickoff", { ascending: true })
  if (error || !data) return []
  const now = getReferenceNow()
  const lookup = await getTeamsLookup(supabase)
  return data.map((row) => mapMatchRow(row, null, now, lookup)).filter((match) => match.status === "LIVE")
}

export async function getUpcomingMatches(supabase: SupabaseClient<Database>): Promise<Match[]> {
  const { data, error } = await matchesTable(supabase).order("kickoff", { ascending: true })
  if (error || !data) return []
  const now = getReferenceNow()
  const lookup = await getTeamsLookup(supabase)
  return data
    .map((row) => mapMatchRow(row, null, now, lookup))
    .filter((match) => match.status === "UPCOMING")
    .slice(0, 3)
}

export async function getMatchById(
  supabase: SupabaseClient<Database>,
  matchId: string,
  userId: string | null,
): Promise<Match | null> {
  const now = getReferenceNow()
  const lookup = await getTeamsLookup(supabase)

  if (userId) {
    const [matchResult, predResult] = await Promise.all([
      applyWorldCupSeasonKickoffFilter(supabase.from("matches").select("*"))
        .eq("id", matchId)
        .maybeSingle(),
      supabase.from("predictions").select("*").eq("match_id", matchId).eq("user_id", userId).maybeSingle(),
    ])
    if (!matchResult.data) return null
    return mapMatchRow(matchResult.data, predResult.data ?? null, now, lookup)
  }

  const { data } = await applyWorldCupSeasonKickoffFilter(supabase.from("matches").select("*"))
    .eq("id", matchId)
    .maybeSingle()
  if (!data) return null
  return mapMatchRow(data, null, now, lookup)
}

export async function getMatchesWithPredictions(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<Match[]> {
  const [matchesResult, predictionsResult] = await Promise.all([
    matchesTable(supabase).order("kickoff", { ascending: true }),
    supabase.from("predictions").select("*").eq("user_id", userId),
  ])

  if (matchesResult.error || !matchesResult.data) return []
  const now = getReferenceNow()
  const lookup = await getTeamsLookup(supabase)
  if (predictionsResult.error || !predictionsResult.data) {
    return matchesResult.data.map((row) => mapMatchRow(row, null, now, lookup))
  }

  const predictionsByMatchId = new Map(
    predictionsResult.data.map((prediction) => [prediction.match_id, prediction] as const)
  )

  return matchesResult.data.map((row) => mapMatchRow(row, predictionsByMatchId.get(row.id) ?? null, now, lookup))
}
