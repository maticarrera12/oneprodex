import type { SlotId } from "@/features/onboarding/types"
import { BRACKET_SCORING, MATCH_SCORING, MATCHUP_HIT_SCORING } from "@/features/scoring/constants"

type KnockoutStage =
  | "Round of 32"
  | "Round of 16"
  | "Quarter-finals"
  | "Semi-finals"
  | "3rd Place Final"
  | "Final"

export type KnockoutMatch = {
  id: string
  home_team_code: string
  away_team_code: string
  home_score: number | null
  away_score: number | null
  home_pen_score: number | null
  away_pen_score: number | null
  status: string
  kickoff: string | null
  stage: string
}

const KNOCKOUT_STAGES = new Set<string>([
  "Round of 32",
  "Round of 16",
  "Quarter-finals",
  "Semi-finals",
  "3rd Place Final",
  "Final",
])

// FIFA M73–M88 kickoff order → app slot (see slot-resolver / Wikipedia 2026)
const FIFA_R32_MATCH_TO_SLOT: SlotId[] = [
  "R32_P3", "R32_P1", "R32_P4", "R32_P9", "R32_P2", "R32_P10",
  "R32_P11", "R32_P12", "R32_P7", "R32_P8", "R32_P5", "R32_P6",
  "R32_P15", "R32_P13", "R32_P16", "R32_P14",
]

const FIFA_R16_MATCH_TO_SLOT: SlotId[] = [
  "R16_P2", "R16_P1", "R16_P5", "R16_P6", "R16_P3", "R16_P4", "R16_P7", "R16_P8",
]

const FIFA_QF_MATCH_TO_SLOT: SlotId[] = ["QF_P1", "QF_P2", "QF_P3", "QF_P4"]
const FIFA_SF_MATCH_TO_SLOT: SlotId[] = ["SF_P1", "SF_P2"]

const STAGE_SLOT_ORDER: Partial<Record<KnockoutStage, SlotId[]>> = {
  "Round of 32": FIFA_R32_MATCH_TO_SLOT,
  "Round of 16": FIFA_R16_MATCH_TO_SLOT,
  "Quarter-finals": FIFA_QF_MATCH_TO_SLOT,
  "Semi-finals": FIFA_SF_MATCH_TO_SLOT,
  "3rd Place Final": ["THIRD"],
  Final: ["FINAL"],
}

export function bracketPointsForSlot(slot: SlotId): number {
  if (slot.startsWith("R32_")) return BRACKET_SCORING.R32
  if (slot.startsWith("R16_")) return BRACKET_SCORING.R16
  if (slot.startsWith("QF_")) return BRACKET_SCORING.QF
  if (slot.startsWith("SF_")) return BRACKET_SCORING.SF
  if (slot === "THIRD") return BRACKET_SCORING.THIRD
  if (slot === "FINAL") return BRACKET_SCORING.FINAL
  return 0
}

export function isKnockoutStage(stage: string): stage is KnockoutStage {
  return KNOCKOUT_STAGES.has(stage)
}

type WinnerResolvable = Pick<
  KnockoutMatch,
  "home_team_code" | "away_team_code" | "home_score" | "away_score" | "home_pen_score" | "away_pen_score" | "status"
>

export function matchWinner(match: WinnerResolvable): string | null {
  if (match.status !== "FINISHED") return null
  if (match.home_score === null || match.away_score === null) return null

  if (match.home_score !== match.away_score) {
    return match.home_score > match.away_score ? match.home_team_code : match.away_team_code
  }

  // Draw: resolve via penalty shoot-out scores
  if (match.home_pen_score === null || match.away_pen_score === null) return null
  if (match.home_pen_score > match.away_pen_score) return match.home_team_code
  if (match.away_pen_score > match.home_pen_score) return match.away_team_code

  return null
}

export function resolveBracketSlotForMatch(
  match: KnockoutMatch,
  stageMatches: KnockoutMatch[],
): SlotId | null {
  if (!isKnockoutStage(match.stage)) return null

  const slotOrder = STAGE_SLOT_ORDER[match.stage]
  if (!slotOrder) return null

  const ordered = [...stageMatches].sort((a, b) => (a.kickoff ?? "").localeCompare(b.kickoff ?? ""))
  const index = ordered.findIndex((row) => row.id === match.id)
  if (index < 0 || index >= slotOrder.length) return null

  return slotOrder[index] ?? null
}

export function buildBracketPickPointsUpdates(
  slot: SlotId,
  winner: string,
  picks: Array<{ user_id: string; team_code: string }>,
): Array<{ user_id: string; slot: SlotId; points: number }> {
  const award = bracketPointsForSlot(slot)
  return picks.map((pick) => ({
    user_id: pick.user_id,
    slot,
    points: pick.team_code === winner ? award : 0,
  }))
}

// Each knockout slot from R16 onward is fed by the winners of two parent slots.
// A user's predicted pairing at a slot is the SET of those two parent winners.
// R32 pairings derive from group picks (not bracket picks) and are excluded.
const SLOT_PARENTS: Partial<Record<SlotId, [SlotId, SlotId]>> = (() => {
  const map: Partial<Record<SlotId, [SlotId, SlotId]>> = {}
  for (let i = 1; i <= 8; i++) map[`R16_P${i}` as SlotId] = [`R32_P${i * 2 - 1}` as SlotId, `R32_P${i * 2}` as SlotId]
  for (let i = 1; i <= 4; i++) map[`QF_P${i}` as SlotId] = [`R16_P${i * 2 - 1}` as SlotId, `R16_P${i * 2}` as SlotId]
  for (let i = 1; i <= 2; i++) map[`SF_P${i}` as SlotId] = [`QF_P${i * 2 - 1}` as SlotId, `QF_P${i * 2}` as SlotId]
  map.FINAL = ["SF_P1", "SF_P2"]
  return map
})()

function matchupHitPointsForSlot(slot: SlotId): number {
  if (slot.startsWith("R16_")) return MATCHUP_HIT_SCORING.R16
  if (slot.startsWith("QF_")) return MATCHUP_HIT_SCORING.QF
  if (slot.startsWith("SF_")) return MATCHUP_HIT_SCORING.SF
  if (slot === "FINAL") return MATCHUP_HIT_SCORING.FINAL
  return 0
}

/**
 * MATCHUP HIT — bonus when the user's predicted pairing at a slot (the SET of the
 * two parent-slot winners they picked) equals the real pairing at that slot.
 * Independent of the winner pick and the scoreline. Returns 0 for R32/THIRD,
 * when a parent pick is missing, or when the pairing differs.
 */
export function scoreMatchupHit(
  slot: SlotId,
  realHome: string,
  realAway: string,
  picksBySlot: Map<SlotId, string>,
): number {
  const bonus = matchupHitPointsForSlot(slot)
  if (bonus === 0) return 0

  const parents = SLOT_PARENTS[slot]
  if (!parents) return 0

  const p1 = picksBySlot.get(parents[0])
  const p2 = picksBySlot.get(parents[1])
  if (!p1 || !p2 || p1 === p2) return 0

  const matches =
    (p1 === realHome && p2 === realAway) || (p1 === realAway && p2 === realHome)
  return matches ? bonus : 0
}

type ResultScoreline = {
  homeTeam: string
  awayTeam: string
  homeScore: number | null
  awayScore: number | null
}

/**
 * RESULT — scores the user's predicted scoreline against the real (regular/AET)
 * scoreline, like the group stage. Aligns the predicted card orientation to the
 * real fixture by team code, so a swapped home/away still scores. Returns 0 when
 * the scoreline is incomplete or the predicted teams are not the real
 * participants. Exact scoreline → exactScore; correct outcome → correctResult.
 */
export function scoreKnockoutResult(
  pred: ResultScoreline,
  real: { homeTeam: string; awayTeam: string; homeScore: number; awayScore: number },
): number {
  if (pred.homeScore === null || pred.awayScore === null) return 0

  let predHome: number
  let predAway: number
  if (pred.homeTeam === real.homeTeam && pred.awayTeam === real.awayTeam) {
    predHome = pred.homeScore
    predAway = pred.awayScore
  } else if (pred.homeTeam === real.awayTeam && pred.awayTeam === real.homeTeam) {
    predHome = pred.awayScore
    predAway = pred.homeScore
  } else {
    return 0
  }

  if (predHome === real.homeScore && predAway === real.awayScore) return MATCH_SCORING.exactScore
  if (Math.sign(predHome - predAway) === Math.sign(real.homeScore - real.awayScore)) {
    return MATCH_SCORING.correctResult
  }
  return 0
}
