import { describe, expect, it } from "vitest"
import type { GroupRankings } from "@/features/onboarding/types"
import { resolveR32Pairs, resolveSlots } from "@/features/onboarding/utils/slot-resolver"

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

describe("resolveR32Pairs (FIFA 2026 / Wikipedia)", () => {
  const bestThirds = ["A3", "B3", "C3", "D3", "E3", "F3", "G3", "H3"]

  // Annex C row 495 (ABCDEFGH): [P11,P15,P7,P1,P8,P2,P16,P12] = H,G,B,C,A,F,D,E
  const FIFA_R32 = [
    { home: "E1", away: "C3" },  // M74: 1E vs 3C (P1)
    { home: "I1", away: "F3" },  // M77: 1I vs 3F (P2)
    { home: "A2", away: "B2" },  // M73: 2A vs 2B
    { home: "F1", away: "C2" },  // M75: 1F vs 2C
    { home: "K2", away: "L2" },  // M83: 2K vs 2L
    { home: "H1", away: "J2" },  // M84: 1H vs 2J
    { home: "D1", away: "B3" },  // M81: 1D vs 3B (P7)
    { home: "G1", away: "A3" },  // M82: 1G vs 3A (P8)
    { home: "C1", away: "F2" },  // M76: 1C vs 2F
    { home: "E2", away: "I2" },  // M78: 2E vs 2I
    { home: "A1", away: "H3" },  // M79: 1A vs 3H (P11)
    { home: "L1", away: "E3" },  // M80: 1L vs 3E (P12)
    { home: "J1", away: "H2" },  // M86: 1J vs 2H
    { home: "D2", away: "G2" },  // M88: 2D vs 2G
    { home: "B1", away: "G3" },  // M85: 1B vs 3G (P15)
    { home: "K1", away: "D3" },  // M87: 1K vs 3D (P16)
  ] as const

  it("seeds all 16 R32 fixtures per official match list", () => {
    expect(resolveR32Pairs(groupRankings, bestThirds)).toEqual([...FIFA_R32])
  })

  it("feeds R16 matches with consecutive R32 pairs (M89–M96 tree)", () => {
    const pairs = resolveR32Pairs(groupRankings, bestThirds)
    const winners = pairs.map((p) => p.home)

    // M90 = W74+W77 → slots P1+P2; M89 = W73+W75 → P3+P4; etc.
    const r16FromPairs = Array.from({ length: 8 }, (_, i) => [winners[i * 2], winners[i * 2 + 1]])
    expect(r16FromPairs).toEqual([
      ["E1", "I1"],  // M90
      ["A2", "F1"],  // M89
      ["K2", "H1"],  // M93
      ["D1", "G1"],  // M94
      ["C1", "E2"],  // M91
      ["A1", "L1"],  // M92
      ["J1", "D2"],  // M95
      ["B1", "K1"],  // M96
    ])
  })
})
