import type { GroupCode, GroupRankings, SlotId } from "@/features/onboarding/types"
import { THIRD_PLACE_COMBOS } from "@/features/onboarding/utils/third-place-combos"

type R32Definition = {
  home: { group: GroupCode; rank: 1 | 2 }
  away:
    | { type: "fixed"; group: GroupCode; rank: 1 | 2 }
    | { type: "third"; slot: "P1" | "P2" | "P7" | "P8" | "P11" | "P12" | "P15" | "P16" }
}

// Slot order is intentional: consecutive pairs feed the same R16 match.
// P1+P2 → R16_P1 → QF_P1 → SF_P1 → FINAL
// P3+P4 → R16_P2 → QF_P1 → SF_P1 → FINAL
// P5+P6 → R16_P3 → QF_P2 → SF_P1 → FINAL
// P7+P8 → R16_P4 → QF_P2 → SF_P1 → FINAL
// P9+P10  → R16_P5 → QF_P3 → SF_P2 → FINAL
// P11+P12 → R16_P6 → QF_P3 → SF_P2 → FINAL
// P13+P14 → R16_P7 → QF_P4 → SF_P2 → FINAL
// P15+P16 → R16_P8 → QF_P4 → SF_P2 → FINAL
//
// Official match numbers (FIFA 2026):
// P1=M74(1E), P2=M77(1I), P7=M81(1D), P8=M82(1G)
// P11=M79(1A), P12=M80(1L), P15=M85(1B), P16=M87(1K)
const R32_SLOT_DEFS: Record<`R32_P${1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16}`, R32Definition> = {
  R32_P1:  { home: { group: "E", rank: 1 }, away: { type: "third", slot: "P1"  } },
  R32_P2:  { home: { group: "I", rank: 1 }, away: { type: "third", slot: "P2"  } },
  R32_P3:  { home: { group: "A", rank: 2 }, away: { type: "fixed", group: "B", rank: 2 } },
  R32_P4:  { home: { group: "F", rank: 1 }, away: { type: "fixed", group: "C", rank: 2 } },
  R32_P5:  { home: { group: "K", rank: 2 }, away: { type: "fixed", group: "L", rank: 2 } },
  R32_P6:  { home: { group: "H", rank: 1 }, away: { type: "fixed", group: "J", rank: 2 } },
  R32_P7:  { home: { group: "D", rank: 1 }, away: { type: "third", slot: "P7"  } },
  R32_P8:  { home: { group: "G", rank: 1 }, away: { type: "third", slot: "P8"  } },
  R32_P9:  { home: { group: "C", rank: 1 }, away: { type: "fixed", group: "F", rank: 2 } },
  R32_P10: { home: { group: "E", rank: 2 }, away: { type: "fixed", group: "I", rank: 2 } },
  R32_P11: { home: { group: "A", rank: 1 }, away: { type: "third", slot: "P11" } },
  R32_P12: { home: { group: "L", rank: 1 }, away: { type: "third", slot: "P12" } },
  R32_P13: { home: { group: "J", rank: 1 }, away: { type: "fixed", group: "H", rank: 2 } },
  R32_P14: { home: { group: "D", rank: 2 }, away: { type: "fixed", group: "G", rank: 2 } },
  R32_P15: { home: { group: "B", rank: 1 }, away: { type: "third", slot: "P15" } },
  R32_P16: { home: { group: "K", rank: 1 }, away: { type: "third", slot: "P16" } },
}

const SLOTS_32: SlotId[] = [
  "R32_P1",  "R32_P2",  "R32_P3",  "R32_P4",
  "R32_P5",  "R32_P6",  "R32_P7",  "R32_P8",
  "R32_P9",  "R32_P10", "R32_P11", "R32_P12",
  "R32_P13", "R32_P14", "R32_P15", "R32_P16",
  "R16_P1",  "R16_P2",  "R16_P3",  "R16_P4",
  "R16_P5",  "R16_P6",  "R16_P7",  "R16_P8",
  "QF_P1",   "QF_P2",   "QF_P3",   "QF_P4",
  "SF_P1",   "SF_P2",
  "THIRD",   "FINAL",
]

function getRankedTeam(rankings: GroupRankings, group: GroupCode, rank: 1 | 2 | 3): string {
  return rankings[group][rank - 1]
}

function buildGroupByTeam(rankings: GroupRankings): Map<string, GroupCode> {
  const map = new Map<string, GroupCode>()
  for (const [group, teams] of Object.entries(rankings) as Array<[GroupCode, string[]]>) {
    map.set(teams[2], group)
  }
  return map
}

function resolveThirdPlaceAssignments(
  rankings: GroupRankings,
  bestThirds: string[],
): Record<"P1"|"P2"|"P7"|"P8"|"P11"|"P12"|"P15"|"P16", string> {
  const groupByTeam = buildGroupByTeam(rankings)

  // Build the key: sorted group letters of the 8 qualifying thirds
  const qualifyingGroups = bestThirds
    .map((team) => groupByTeam.get(team))
    .filter((g): g is GroupCode => g !== undefined)

  const key = [...new Set(qualifyingGroups)].sort().join("")
  const combo = THIRD_PLACE_COMBOS[key]

  if (combo) {
    // combo: [P11, P15, P7, P1, P8, P2, P16, P12]
    const [c11, c15, c7, c1, c8, c2, c16, c12] = combo
    const third = (g: string) => rankings[g as GroupCode]?.[2] ?? bestThirds[0] ?? ""
    return { P1: third(c1), P2: third(c2), P7: third(c7), P8: third(c8), P11: third(c11), P12: third(c12), P15: third(c15), P16: third(c16) }
  }

  // Fallback: distribute sequentially (shouldn't happen with valid input)
  const slots = ["P1","P2","P7","P8","P11","P12","P15","P16"] as const
  const result = {} as Record<"P1"|"P2"|"P7"|"P8"|"P11"|"P12"|"P15"|"P16", string>
  slots.forEach((s, i) => { result[s] = bestThirds[i] ?? "" })
  return result
}

export function resolveR32Pairs(
  groupRankings: GroupRankings,
  bestThirds: string[]
): Array<{ home: string; away: string }> {
  const thirds = resolveThirdPlaceAssignments(groupRankings, bestThirds)

  return (SLOTS_32.slice(0, 16) as Array<keyof typeof R32_SLOT_DEFS>).map((slot) => R32_SLOT_DEFS[slot]).map((def) => ({
    home: getRankedTeam(groupRankings, def.home.group, def.home.rank),
    away: def.away.type === "fixed"
      ? getRankedTeam(groupRankings, def.away.group, def.away.rank)
      : thirds[def.away.slot],
  }))
}

export function resolveSlots(groupRankings: GroupRankings, bestThirds: string[]): Record<SlotId, string> {
  const resolved = {} as Record<SlotId, string>
  const thirds = resolveThirdPlaceAssignments(groupRankings, bestThirds)

  for (const [slot, def] of Object.entries(R32_SLOT_DEFS) as Array<[keyof typeof R32_SLOT_DEFS, R32Definition]>) {
    const home = getRankedTeam(groupRankings, def.home.group, def.home.rank)
    const away = def.away.type === "fixed"
      ? getRankedTeam(groupRankings, def.away.group, def.away.rank)
      : thirds[def.away.slot]
    resolved[slot] = home || away
  }

  resolved.R16_P1 = resolved.R32_P1
  resolved.R16_P2 = resolved.R32_P3
  resolved.R16_P3 = resolved.R32_P5
  resolved.R16_P4 = resolved.R32_P7
  resolved.R16_P5 = resolved.R32_P9
  resolved.R16_P6 = resolved.R32_P11
  resolved.R16_P7 = resolved.R32_P13
  resolved.R16_P8 = resolved.R32_P15

  resolved.QF_P1 = resolved.R16_P1
  resolved.QF_P2 = resolved.R16_P3
  resolved.QF_P3 = resolved.R16_P5
  resolved.QF_P4 = resolved.R16_P7

  resolved.SF_P1 = resolved.QF_P1
  resolved.SF_P2 = resolved.QF_P3
  resolved.THIRD = resolved.SF_P2
  resolved.FINAL = resolved.SF_P1

  for (const slot of SLOTS_32) {
    if (!resolved[slot]) {
      resolved[slot] = bestThirds[0] ?? groupRankings.A[0]
    }
  }

  return resolved
}
