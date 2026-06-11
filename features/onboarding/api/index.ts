import type { SupabaseClient } from "@supabase/supabase-js"
import type { BracketPick, GroupCode, GroupRankings, OnboardingState, OnboardingStep } from "@/features/onboarding/types"
import type { Database } from "@/lib/supabase/database.types"
import type { GroupStageMatch, MatchWithPrediction } from "@/features/onboarding/components/prode-picks-screen"
import { buildTeamToGroupMap } from "@/features/onboarding/utils/team-groups"

type GroupPickRow = Pick<Database["public"]["Tables"]["group_picks"]["Row"], "group_code" | "position" | "team_code">
type BracketPickRow = Pick<Database["public"]["Tables"]["bracket_picks"]["Row"], "slot" | "team_code">
type TournamentPredictionRow = Pick<
  Database["public"]["Tables"]["tournament_predictions"]["Row"],
  "top_scorer_api_id" | "best_player_api_id" | "best_young_player_api_id"
>

const GROUP_STAGE_MATCH_COUNT = 72

export type DeriveStepInput = {
  awardsAt: string | null
  prodePicksSubmittedAt?: string | null
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
  if (input.awardsAt) return { status: 'complete' }
  if (!input.onboardingMode) return { status: 'mode_select' }

  if (input.onboardingMode === 'prode') {
    if (input.prodePickCount < input.groupStageMatchCount) {
      if (input.prodePicksSubmittedAt) return { status: 'awards' }
      return { status: 'prode_picks', filled: input.prodePickCount, total: input.groupStageMatchCount }
    }
    if (input.bracketPickCount < 32) return { status: 'bracket' }
    return { status: 'awards' }
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

export async function getGroupStageMatchesWithPredictions(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<Partial<Record<GroupCode, MatchWithPrediction[]>>> {
  const [standingsResult, teamsResult, matchesResult, predictionsResult] = await Promise.all([
    supabase.from("standings").select("group_code,team_code"),
    supabase.from("teams").select("api_id,code"),
    supabase
      .from("matches")
      .select("id,home_team_code,away_team_code,kickoff,stage")
      .ilike("stage", "Group Stage%")
      .order("kickoff", { ascending: true }),
    supabase
      .from("predictions")
      .select("match_id,home_score,away_score")
      .eq("user_id", userId),
  ])

  // Resolve numeric api_id team codes → canonical code (same as getStandingsByGroup)
  const teamToGroup = buildTeamToGroupMap(standingsResult.data ?? [], teamsResult.data ?? [])

  const predByMatchId = new Map((predictionsResult.data ?? []).map((p) => [p.match_id, p]))

  const result: Partial<Record<GroupCode, MatchWithPrediction[]>> = {}
  for (const match of matchesResult.data ?? []) {
    const homeCode = match.home_team_code.trim().toUpperCase()
    const awayCode = match.away_team_code.trim().toUpperCase()
    const group = teamToGroup.get(homeCode) ?? teamToGroup.get(awayCode)
    if (!group) continue
    if (!result[group]) result[group] = []
    const pred = predByMatchId.get(match.id)
    result[group]!.push({
      match: {
        id: match.id,
        home_team_code: homeCode,
        away_team_code: awayCode,
        group_code: group,
        kickoff: match.kickoff,
      },
      prediction: pred ? { home_score: pred.home_score, away_score: pred.away_score } : null,
    })
  }

  return result
}

export async function getOnboardingState(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<OnboardingState> {
  const [userResult, groupCountResult, bestThirdCountResult, bracketCountResult, tournamentResult, prodePickCountResult] = await Promise.all([
    supabase.from("users").select("awards_at,prode_picks_submitted_at,onboarding_mode").eq("id", userId).maybeSingle(),
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
    awardsAt: userData?.awards_at ?? null,
    prodePicksSubmittedAt: userData?.prode_picks_submitted_at ?? null,
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
