import type { SupabaseClient } from "@supabase/supabase-js"
import type { Match } from "@/features/matches/types"
import type { Database } from "@/lib/supabase/database.types"

type MatchRow = Database["public"]["Tables"]["matches"]["Row"]
type PredictionRow = Database["public"]["Tables"]["predictions"]["Row"]

function normalizeMatchStatus(status: string): Match["status"] {
  if (status === "LIVE") return "LIVE"
  if (status === "FINISHED") return "FINISHED"
  return "UPCOMING"
}

function mapMatchRow(row: MatchRow, prediction: PredictionRow | null = null): Match {
  return {
    id: row.id,
    home: row.home_team_code,
    away: row.away_team_code,
    hs: row.home_score,
    as: row.away_score,
    pred: prediction
      ? {
          hs: prediction.home_score,
          as: prediction.away_score,
        }
      : null,
    status: normalizeMatchStatus(row.status),
    minute: row.minute,
    kickoff: row.kickoff,
    stage: row.stage,
  }
}

export async function getMatches(supabase: SupabaseClient<Database>): Promise<Match[]> {
  const { data, error } = await supabase.from("matches").select("*").order("kickoff", { ascending: true })
  if (error || !data) return []
  return data.map((row) => mapMatchRow(row))
}

export async function getLiveMatches(supabase: SupabaseClient<Database>): Promise<Match[]> {
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .eq("status", "LIVE")
    .order("kickoff", { ascending: true })
  if (error || !data) return []
  return data.map((row) => mapMatchRow(row))
}

export async function getUpcomingMatches(supabase: SupabaseClient<Database>): Promise<Match[]> {
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .not("status", "in", "(LIVE,FINISHED)")
    .order("kickoff", { ascending: true })
    .limit(3)
  if (error || !data) return []
  return data.map((row) => mapMatchRow(row))
}

export async function getMatchesWithPredictions(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<Match[]> {
  const [matchesResult, predictionsResult] = await Promise.all([
    supabase.from("matches").select("*").order("kickoff", { ascending: true }),
    supabase.from("predictions").select("*").eq("user_id", userId),
  ])

  if (matchesResult.error || !matchesResult.data) return []
  if (predictionsResult.error || !predictionsResult.data) {
    return matchesResult.data.map((row) => mapMatchRow(row))
  }

  const predictionsByMatchId = new Map(
    predictionsResult.data.map((prediction) => [prediction.match_id, prediction] as const)
  )

  return matchesResult.data.map((row) => mapMatchRow(row, predictionsByMatchId.get(row.id) ?? null))
}
