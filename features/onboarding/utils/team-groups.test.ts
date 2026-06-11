import { describe, expect, it } from "vitest"
import { buildTeamToGroupMap, normalizeGroupCode } from "@/features/onboarding/utils/team-groups"

describe("normalizeGroupCode", () => {
  it("strips the 'Group ' prefix and uppercases", () => {
    expect(normalizeGroupCode("Group A")).toBe("A")
    expect(normalizeGroupCode(" group b ")).toBe("B")
    expect(normalizeGroupCode("C")).toBe("C")
  })
})

describe("buildTeamToGroupMap", () => {
  it("maps canonical team codes to their group from standings", () => {
    const map = buildTeamToGroupMap(
      [
        { group_code: "Group A", team_code: "ARG" },
        { group_code: "Group B", team_code: "bra" },
      ],
      [
        { api_id: 26, code: "ARG" },
        { api_id: 6, code: "BRA" },
      ]
    )

    expect(map.get("ARG")).toBe("A")
    expect(map.get("BRA")).toBe("B")
  })

  it("resolves numeric api_id team codes in standings to canonical codes", () => {
    const map = buildTeamToGroupMap(
      [{ group_code: "Group C", team_code: "1530" }],
      [{ api_id: 1530, code: "JOR" }]
    )

    expect(map.get("JOR")).toBe("C")
  })

  it("ignores standings rows with invalid group codes", () => {
    const map = buildTeamToGroupMap(
      [{ group_code: "Knockout", team_code: "ARG" }],
      [{ api_id: 26, code: "ARG" }]
    )

    expect(map.size).toBe(0)
  })
})
