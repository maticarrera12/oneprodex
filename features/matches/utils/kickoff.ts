import type { Match } from "@/features/matches/types"

// Kickoffs are stored as instants (UTC); the product always shows them in
// Argentina time. Never rely on the runtime timezone: the server renders in
// UTC on Vercel and would shift both times and day groupings.
export const AR_TIME_ZONE = "America/Argentina/Buenos_Aires"

export function parseKickoff(kickoff: string): Date | null {
  const parsed = new Date(kickoff)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function formatKickoffParts(kickoff: string): { date: string; time: string } {
  const parsed = parseKickoff(kickoff)
  if (!parsed) {
    const fallback = kickoff.split(" · ")
    return { date: fallback[0] ?? kickoff, time: fallback[1] ?? "" }
  }

  return {
    date: new Intl.DateTimeFormat("es-AR", {
      timeZone: AR_TIME_ZONE,
      day: "2-digit",
      month: "2-digit",
    }).format(parsed),
    time: new Intl.DateTimeFormat("es-AR", {
      timeZone: AR_TIME_ZONE,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(parsed),
  }
}

export function getKickoffDayKey(kickoff: string): string {
  const parsed = parseKickoff(kickoff)
  if (!parsed) return kickoff.split(" · ")[0] ?? kickoff

  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: AR_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(parsed)
}

export function formatDayHeading(kickoff: string): string {
  const parsed = parseKickoff(kickoff)
  if (!parsed) return kickoff.split(" · ")[0] ?? kickoff

  const label = new Intl.DateTimeFormat("es-AR", {
    timeZone: AR_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(parsed)

  return label.charAt(0).toUpperCase() + label.slice(1)
}

export type MatchDayStageGroup = {
  stage: string
  matches: Match[]
}

export type MatchDayGroup = {
  dayKey: string
  dayLabel: string
  stages: MatchDayStageGroup[]
}

export function groupMatchesByDay(matches: Match[]): MatchDayGroup[] {
  const sorted = [...matches].sort((a, b) => {
    const aTime = parseKickoff(a.kickoff)?.getTime() ?? 0
    const bTime = parseKickoff(b.kickoff)?.getTime() ?? 0
    return aTime - bTime
  })

  const dayMap = new Map<string, MatchDayGroup>()

  for (const match of sorted) {
    const dayKey = getKickoffDayKey(match.kickoff)
    let dayGroup = dayMap.get(dayKey)

    if (!dayGroup) {
      dayGroup = {
        dayKey,
        dayLabel: formatDayHeading(match.kickoff),
        stages: [],
      }
      dayMap.set(dayKey, dayGroup)
    }

    let stageGroup = dayGroup.stages.find((group) => group.stage === match.stage)
    if (!stageGroup) {
      stageGroup = { stage: match.stage, matches: [] }
      dayGroup.stages.push(stageGroup)
    }

    stageGroup.matches.push(match)
  }

  return Array.from(dayMap.values())
}
