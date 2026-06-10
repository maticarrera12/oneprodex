import { describe, expect, it } from "vitest"

import { normalizeInviteCode } from "@/features/groups/utils/invite-code"

describe("normalizeInviteCode", () => {
  it("trims and uppercases invite codes", () => {
    expect(normalizeInviteCode("  abc123  ")).toBe("ABC123")
  })

  it("extracts the code from an invite URL", () => {
    expect(normalizeInviteCode("https://oneprodex.com/unirse?code=abc123")).toBe("ABC123")
  })

  it("returns an empty string for empty input", () => {
    expect(normalizeInviteCode("   ")).toBe("")
  })
})
