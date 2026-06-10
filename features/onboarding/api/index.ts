import type { SupabaseClient } from "@supabase/supabase-js"
import type { BracketPick, GroupCode, GroupRankings, OnboardingState, OnboardingStep } from "@/features/onboarding/types"
import type { Database } from "@/lib/supabase/database.types"
import type { GroupStageMatch, MatchWithPrediction } from "@/features/onboarding/components/prode-picks-screen"

type GroupPickRow = Pick<Database["public"]["Tables"]["group_picks"]["Row"], "group_code" | "position" | "team_code">
type BracketPickRow = Pick<Database["public"]["Tables"]["bracket_picks"]["Row"], "slot" | "team_code">
type TournamentPredictionRow = Pick<
  Database["public"]["Tables"]["tournament_predictions"]["Row"],
  "top_scorer_api_id" | "best_player_api_id" | "best_young_player_api_id"
>

const GROUP_STAGE_MATCH_COUNT = 72

export type DeriveStepInput = {
  submittedAt: string | null
  onboardingMode: string | null
  groupPickCount: number
  bestThirdCount: number
  bracketPickCount: number
  hasTournamentPrediction: boolean
  hasAllAwards: boolean
  prodePickCount: number
  groupStageMatchCount: number
}

export function deriveOnboardingStep(input: DeriveStepInput): OnboardingStep {
  if (input.submittedAt) return { status: 'complete' }
  if (!input.onboardingMode) return { status: 'mode_select' }

  if (input.onboardingMode === 'prode') {
    if (input.prodePickCount < input.groupStageMatchCount)
      return { status: 'prode_picks', filled: input.prodePickCount, total: input.groupStageMatchCount }
    if (input.bracketPickCount < 32) return { status: 'bracket' }
    if (!input.hasAllAwards) return { status: 'awards' }
    return { status: 'complete' }
  }

  // mode = 'quick' — existing 4-step logic
  if (input.groupPickCount < 48) return { status: 'quick_step', step: 1 }
  if (input.bestThirdCount < 8) return { status: 'quick_step', step: 2 }
  if (input.bracketPickCount < 32) return { status: 'quick_step', step: 3 }
  return { status: 'quick_step', step: 4 }
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

function groupCodeFromStage(stage: string | null): GroupCode | null {
  if (!stage) return null
  const m = stage.match(/Group\s+([A-L])$/i)
  return m ? (m[1].toUpperCase() as GroupCode) : null
}

export async function getGroupStageMatchesWithPredictions(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<Partial<Record<GroupCode, MatchWithPrediction[]>>> {
  const [matchesResult, predictionsResult] = await Promise.all([
    supabase
      .from("matches")
      .select("id,home_team_code,away_team_code,stage,kickoff")
      .ilike("stage", "Group Stage%")
      .order("kickoff", { ascending: true }),
    supabase
      .from("predictions")
      .select("match_id,home_score,away_score")
      .eq("user_id", userId),
  ])

  const matches = matchesResult.data ?? []
  const predictions = predictionsResult.data ?? []

  const predByMatchId = new Map(predictions.map((p) => [p.match_id, p]))

  const result: Partial<Record<GroupCode, MatchWithPrediction[]>> = {}
  for (const match of matches) {
    const group = groupCodeFromStage(match.stage)
    if (!group) continue
    if (!result[group]) result[group] = []
    const pred = predByMatchId.get(match.id)
    result[group]!.push({
      match: {
        id: match.id,
        home_team_code: match.home_team_code,
        away_team_code: match.away_team_code,
        group_code: group,
        kickoff: match.kickoff,
      },
      prediction: pred
        ? { home_score: pred.home_score, away_score: pred.away_score }
        : null,
    })
  }

  return result
}

export async function getOnboardingState(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<OnboardingState> {
  const [userResult, groupCountResult, bestThirdCountResult, bracketCountResult, tournamentResult, prodePickCountResult] = await Promise.all([
    supabase.from("users").select("bracket_submitted_at,onboarding_mode").eq("id", userId).maybeSingle(),
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
    supabase
      .from("predictions")
      .select("match_id, matches!inner(stage)", { count: "exact", head: true })
      .eq("user_id", userId)
      .ilike("matches.stage", "Group Stage%"),
  ])

  const tournamentPrediction = tournamentResult.error ? null : tournamentResult.data
  const userData = userResult.error ? null : userResult.data
  const step = deriveOnboardingStep({
    submittedAt: userData?.bracket_submitted_at ?? null,
    onboardingMode: userData?.onboarding_mode ?? null,
    groupPickCount: groupCountResult.count ?? 0,
    bestThirdCount: bestThirdCountResult.count ?? 0,
    bracketPickCount: bracketCountResult.count ?? 0,
    hasTournamentPrediction: Boolean(tournamentPrediction),
    hasAllAwards: Boolean(
      tournamentPrediction?.top_scorer_api_id &&
        tournamentPrediction?.best_player_api_id &&
        tournamentPrediction?.best_young_player_api_id
    ),
    prodePickCount: prodePickCountResult.count ?? 0,
    groupStageMatchCount: GROUP_STAGE_MATCH_COUNT,
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
