import type { SlotId } from "@/features/onboarding/types"
import { BRACKET_SCORING } from "@/features/scoring/constants"

type KnockoutStage =
  | "Round of 32"
  | "Round of 16"
  | "Quarter-finals"
  | "Semi-finals"
  | "3rd Place Final"
  | "Final"

type KnockoutMatch = {
  id: string
  home_team_code: string
  away_team_code: string
  home_score: number | null
  away_score: number | null
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

function matchWinner(match: KnockoutMatch): string | null {
  if (match.status !== "FINISHED") return null
  if (match.home_score === null || match.away_score === null) return null
  if (match.home_score === match.away_score) return null
  return match.home_score > match.away_score ? match.home_team_code : match.away_team_code
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

export { matchWinner }
