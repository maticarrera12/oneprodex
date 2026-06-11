import type { GroupCode } from "@/features/onboarding/types"

export type StandingGroupRow = { group_code: string; team_code: string }
export type TeamCodeRow = { api_id: number | null; code: string }

const VALID_GROUPS: GroupCode[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]

export function normalizeGroupCode(raw: string): string {
  const s = raw.trim().toUpperCase()
  return s.startsWith("GROUP ") ? s.slice(6) : s
}

// matches.stage holds the matchday ("Group Stage - 1/2/3"), so the only
// reliable team→group source is the standings table. Standings may reference
// teams by canonical code or by numeric api_id — resolve both to the code.
export function buildTeamToGroupMap(standings: StandingGroupRow[], teams: TeamCodeRow[]): Map<string, GroupCode> {
  const byApiId = new Map<string, string>()
  const byCode = new Set<string>()
  for (const t of teams) {
    const canonical = t.code.trim().toUpperCase()
    byCode.add(canonical)
    if (t.api_id != null) byApiId.set(String(t.api_id), canonical)
  }

  const teamToGroup = new Map<string, GroupCode>()
  for (const row of standings) {
    const g = normalizeGroupCode(row.group_code) as GroupCode
    if (!VALID_GROUPS.includes(g)) continue
    const raw = row.team_code.trim()
    const canonical = byCode.has(raw.toUpperCase())
      ? raw.toUpperCase()
      : (byApiId.get(raw) ?? raw.toUpperCase())
    teamToGroup.set(canonical, g)
  }
  return teamToGroup
}
