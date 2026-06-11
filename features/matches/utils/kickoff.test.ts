import { describe, expect, it } from "vitest"
import { formatDayHeading, formatKickoffParts, getKickoffDayKey } from "@/features/matches/utils/kickoff"

// 01:00 UTC on June 12 = 22:00 on June 11 in Argentina (UTC-3).
// The suite runs with TZ=UTC (vitest.config), so these fail if the
// formatter falls back to the runtime timezone instead of Argentina's.
const LATE_KICKOFF = "2026-06-12T01:00:00+00:00"

describe("formatKickoffParts", () => {
  it("formats the time in Argentina timezone regardless of runtime TZ", () => {
    expect(formatKickoffParts(LATE_KICKOFF).time).toBe("22:00")
  })

  it("formats the date in Argentina timezone when kickoff crosses midnight UTC", () => {
    // es-AR ICU renders day/month as "11/6" even with 2-digit month
    expect(formatKickoffParts(LATE_KICKOFF).date).toBe("11/6")
  })

  it("keeps the legacy fallback for unparseable strings", () => {
    expect(formatKickoffParts("Hoy · 18:00")).toEqual({ date: "Hoy", time: "18:00" })
  })
})

describe("getKickoffDayKey", () => {
  it("groups a late-night match under its Argentina calendar day", () => {
    expect(getKickoffDayKey(LATE_KICKOFF)).toBe("2026-06-11")
  })

  it("keeps the same day for an afternoon match", () => {
    expect(getKickoffDayKey("2026-06-11T18:00:00+00:00")).toBe("2026-06-11")
  })
})

describe("formatDayHeading", () => {
  it("labels the day using the Argentina calendar day", () => {
    const label = formatDayHeading(LATE_KICKOFF)
    expect(label.toLowerCase()).toContain("jueves")
    expect(label).toContain("11")
    expect(label.toLowerCase()).toContain("junio")
  })
})
