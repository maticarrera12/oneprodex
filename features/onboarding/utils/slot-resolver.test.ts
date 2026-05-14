import { describe, expect, it } from "vitest"
import type { GroupRankings } from "@/features/onboarding/types"
import { resolveSlots } from "@/features/onboarding/utils/slot-resolver"

const groupRankings: GroupRankings = {
  A: ["A1", "A2", "A3", "A4"],
  B: ["B1", "B2", "B3", "B4"],
  C: ["C1", "C2", "C3", "C4"],
  D: ["D1", "D2", "D3", "D4"],
  E: ["E1", "E2", "E3", "E4"],
  F: ["F1", "F2", "F3", "F4"],
  G: ["G1", "G2", "G3", "G4"],
  H: ["H1", "H2", "H3", "H4"],
  I: ["I1", "I2", "I3", "I4"],
  J: ["J1", "J2", "J3", "J4"],
  K: ["K1", "K2", "K3", "K4"],
  L: ["L1", "L2", "L3", "L4"],
}

describe("resolveSlots", () => {
  it("returns all 32 slots populated", () => {
    const resolved = resolveSlots(groupRankings, ["A3", "B3", "C3", "D3", "E3", "F3", "G3", "H3"])

    expect(Object.keys(resolved)).toHaveLength(32)
    expect(Object.values(resolved).every((value) => value.length > 0)).toBe(true)
  })

  it("is deterministic for different best-third combinations", () => {
    const combos = [
      ["A3", "B3", "C3", "D3", "E3", "F3", "G3", "H3"],
      ["A3", "B3", "C3", "D3", "E3", "F3", "I3", "J3"],
      ["A3", "B3", "C3", "D3", "G3", "H3", "I3", "J3"],
    ] as const

    for (const combo of combos) {
      const first = resolveSlots(groupRankings, [...combo])
      const second = resolveSlots(groupRankings, [...combo])
      expect(first).toEqual(second)
    }
  })

  it("matches snapshot for fixed known input", () => {
    const resolved = resolveSlots(groupRankings, ["A3", "B3", "C3", "D3", "E3", "F3", "G3", "H3"])
    expect(resolved).toMatchSnapshot()
  })
})
