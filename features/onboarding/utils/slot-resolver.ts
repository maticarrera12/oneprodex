import type { GroupCode, GroupRankings, SlotId } from "@/features/onboarding/types"

type R32Definition = {
  home: { group: GroupCode; rank: 1 | 2 }
  away:
    | { type: "fixed"; group: GroupCode; rank: 1 | 2 }
    | { type: "third"; groups: GroupCode[] }
}

const R32_SLOT_DEFS: Record<`R32_P${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16}`, R32Definition> = {
  R32_P1: { home: { group: "A", rank: 1 }, away: { type: "third", groups: ["B", "C", "D", "E", "F"] } },
  R32_P2: { home: { group: "B", rank: 1 }, away: { type: "third", groups: ["A", "C", "G", "H", "I"] } },
  R32_P3: { home: { group: "C", rank: 1 }, away: { type: "fixed", group: "D", rank: 2 } },
  R32_P4: { home: { group: "D", rank: 1 }, away: { type: "fixed", group: "C", rank: 2 } },
  R32_P5: { home: { group: "E", rank: 1 }, away: { type: "third", groups: ["A", "B", "G", "J", "K"] } },
  R32_P6: { home: { group: "F", rank: 1 }, away: { type: "fixed", group: "E", rank: 2 } },
  R32_P7: { home: { group: "G", rank: 1 }, away: { type: "third", groups: ["B", "D", "F", "H", "L"] } },
  R32_P8: { home: { group: "H", rank: 1 }, away: { type: "fixed", group: "G", rank: 2 } },
  R32_P9: { home: { group: "I", rank: 1 }, away: { type: "third", groups: ["C", "D", "E", "F", "H"] } },
  R32_P10: { home: { group: "J", rank: 1 }, away: { type: "fixed", group: "I", rank: 2 } },
  R32_P11: { home: { group: "K", rank: 1 }, away: { type: "third", groups: ["A", "E", "H", "I", "L"] } },
  R32_P12: { home: { group: "L", rank: 1 }, away: { type: "fixed", group: "K", rank: 2 } },
  R32_P13: { home: { group: "A", rank: 2 }, away: { type: "fixed", group: "B", rank: 2 } },
  R32_P14: { home: { group: "F", rank: 2 }, away: { type: "third", groups: ["C", "D", "J", "K", "L"] } },
  R32_P15: { home: { group: "J", rank: 2 }, away: { type: "fixed", group: "L", rank: 2 } },
  R32_P16: { home: { group: "H", rank: 2 }, away: { type: "third", groups: ["A", "B", "E", "G", "K"] } },
}

const SLOTS_32: SlotId[] = [
  "R32_P1",
  "R32_P2",
  "R32_P3",
  "R32_P4",
  "R32_P5",
  "R32_P6",
  "R32_P7",
  "R32_P8",
  "R32_P9",
  "R32_P10",
  "R32_P11",
  "R32_P12",
  "R32_P13",
  "R32_P14",
  "R32_P15",
  "R32_P16",
  "R16_P1",
  "R16_P2",
  "R16_P3",
  "R16_P4",
  "R16_P5",
  "R16_P6",
  "R16_P7",
  "R16_P8",
  "QF_P1",
  "QF_P2",
  "QF_P3",
  "QF_P4",
  "SF_P1",
  "SF_P2",
  "THIRD",
  "FINAL",
]

function getRankedTeam(rankings: GroupRankings, group: GroupCode, rank: 1 | 2 | 3): string {
  return rankings[group][rank - 1]
}

function buildThirdPlaceMap(rankings: GroupRankings): Map<string, GroupCode> {
  const map = new Map<string, GroupCode>()
  const groups = Object.keys(rankings) as GroupCode[]
  for (const group of groups) {
    map.set(rankings[group][2], group)
  }
  return map
}

function resolveThirdPlaceTeam(
  rankings: GroupRankings,
  bestThirds: string[],
  allowedGroups: GroupCode[]
): string {
  const teamToGroup = buildThirdPlaceMap(rankings)
  const picked = new Set(bestThirds)

  for (const group of allowedGroups) {
    const third = rankings[group][2]
    if (picked.has(third)) return third
  }

  for (const team of bestThirds) {
    const group = teamToGroup.get(team)
    if (group && allowedGroups.includes(group)) return team
  }

  return bestThirds[0] ?? rankings[allowedGroups[0]][2]
}

export function resolveSlots(groupRankings: GroupRankings, bestThirds: string[]): Record<SlotId, string> {
  const resolved = {} as Record<SlotId, string>

  for (const [slot, definition] of Object.entries(R32_SLOT_DEFS) as Array<
    [keyof typeof R32_SLOT_DEFS, R32Definition]
  >) {
    const home = getRankedTeam(groupRankings, definition.home.group, definition.home.rank)
    const away =
      definition.away.type === "fixed"
        ? getRankedTeam(groupRankings, definition.away.group, definition.away.rank)
        : resolveThirdPlaceTeam(groupRankings, bestThirds, definition.away.groups)

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
