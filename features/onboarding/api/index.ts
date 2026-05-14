import type { SupabaseClient } from "@supabase/supabase-js"
import type { BracketPick, GroupCode, GroupRankings, OnboardingState } from "@/features/onboarding/types"
import type { Database } from "@/lib/supabase/database.types"

type GroupPickRow = Pick<Database["public"]["Tables"]["group_picks"]["Row"], "group_code" | "position" | "team_code">
type BracketPickRow = Pick<Database["public"]["Tables"]["bracket_picks"]["Row"], "slot" | "team_code">
type TournamentPredictionRow = Pick<
  Database["public"]["Tables"]["tournament_predictions"]["Row"],
  "top_scorer_api_id" | "best_player_api_id" | "best_young_player_api_id"
>

export type DeriveStepInput = {
  submittedAt: string | null
  groupPickCount: number
  bestThirdCount: number
  bracketPickCount: number
  hasTournamentPrediction: boolean
  hasAllAwards: boolean
}

export function deriveOnboardingStep(input: DeriveStepInput): OnboardingState["step"] {
  if (input.submittedAt) return "complete"
  if (input.groupPickCount < 48) return 1
  if (input.bestThirdCount < 8) return 2
  if (input.bracketPickCount < 32) return 3
  if (!input.hasTournamentPrediction || !input.hasAllAwards) return 4
  return 4
}

function emptyGroupRankings(): GroupRankings {
  return {
    A: ["", "", "", ""],
    B: ["", "", "", ""],
    C: ["", "", "", ""],
    D: ["", "", "", ""],
    E: ["", "", "", ""],
    F: ["", "", "", ""],
    G: ["", "", "", ""],
    H: ["", "", "", ""],
    I: ["", "", "", ""],
    J: ["", "", "", ""],
    K: ["", "", "", ""],
    L: ["", "", "", ""],
  }
}

function mapRankings(rows: GroupPickRow[]): GroupRankings | null {
  if (rows.length === 0) return null
  const rankings = emptyGroupRankings()
  for (const row of rows) {
    const group = row.group_code as GroupCode
    const idx = row.position - 1
    if (!rankings[group] || idx < 0 || idx > 3) continue
    rankings[group][idx] = row.team_code
  }

  return rankings
}

function mapBracketPicks(rows: BracketPickRow[]): OnboardingState["bracketPicks"] {
  if (rows.length === 0) return null
  return rows.map((row) => ({ slot: row.slot as BracketPick["slot"], team_code: row.team_code }))
}

function mapTournamentPrediction(row: TournamentPredictionRow | null): OnboardingState["tournamentPredictions"] {
  if (!row) return null
  return {
    top_scorer_api_id: row.top_scorer_api_id,
    best_player_api_id: row.best_player_api_id,
    best_young_player_api_id: row.best_young_player_api_id,
  }
}

export async function getOnboardingState(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<OnboardingState> {
  const [userResult, groupCountResult, bestThirdCountResult, bracketCountResult, tournamentResult] = await Promise.all([
    supabase.from("users").select("bracket_submitted_at").eq("id", userId).maybeSingle(),
    supabase.from("group_picks").select("user_id", { count: "exact", head: true }).eq("user_id", userId),
    supabase
      .from("group_picks")
      .select("user_id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("position", 3)
      .eq("advances_as_third", true),
    supabase.from("bracket_picks").select("user_id", { count: "exact", head: true }).eq("user_id", userId),
    supabase
      .from("tournament_predictions")
      .select("top_scorer_api_id,best_player_api_id,best_young_player_api_id")
      .eq("user_id", userId)
      .maybeSingle(),
  ])

  const tournamentPrediction = tournamentResult.error ? null : tournamentResult.data
  const step = deriveOnboardingStep({
    submittedAt: userResult.error ? null : userResult.data?.bracket_submitted_at ?? null,
    groupPickCount: groupCountResult.count ?? 0,
    bestThirdCount: bestThirdCountResult.count ?? 0,
    bracketPickCount: bracketCountResult.count ?? 0,
    hasTournamentPrediction: Boolean(tournamentPrediction),
    hasAllAwards: Boolean(
      tournamentPrediction?.top_scorer_api_id &&
        tournamentPrediction?.best_player_api_id &&
        tournamentPrediction?.best_young_player_api_id
    ),
  })

  const [groupRowsResult, bestThirdRowsResult, bracketRowsResult] = await Promise.all([
    supabase
      .from("group_picks")
      .select("group_code,position,team_code")
      .eq("user_id", userId)
      .order("group_code", { ascending: true })
      .order("position", { ascending: true }),
    supabase
      .from("group_picks")
      .select("team_code")
      .eq("user_id", userId)
      .eq("position", 3)
      .eq("advances_as_third", true)
      .order("group_code", { ascending: true }),
    supabase.from("bracket_picks").select("slot,team_code").eq("user_id", userId).order("slot", { ascending: true }),
  ])

  return {
    step,
    groupRankings: groupRowsResult.error ? null : mapRankings(groupRowsResult.data ?? []),
    bestThirds: bestThirdRowsResult.error ? null : (bestThirdRowsResult.data ?? []).map((row) => row.team_code),
    bracketPicks: bracketRowsResult.error ? null : mapBracketPicks(bracketRowsResult.data ?? []),
    tournamentPredictions: mapTournamentPrediction(tournamentPrediction),
  }
}
