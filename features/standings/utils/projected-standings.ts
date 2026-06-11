import {
  sortTeamsByOlympicTiebreak,
  type GroupMatchResult,
} from "@/features/standings/utils/group-tiebreak"

export type ProjectedMatch = {
  id: string
  groupCode: string
  home: string
  away: string
}

export type ProjectedPrediction = {
  matchId: string
  homeScore: number
  awayScore: number
}

export type ProjectedTeamAccum = {
  pj: number
  g: number
  e: number
  p: number
  gf: number
  ga: number
  gd: number
  pts: number
}

type ComputeProjectedStandingRowsInput<Row> = {
  groupToTeams: Map<string, string[]>
  teamAliasesByGroup?: Map<string, Map<string, string>>
  matches: ProjectedMatch[]
  predictions: ProjectedPrediction[]
  buildRow: (teamCode: string, accum: ProjectedTeamAccum, position: number) => Row
}

function emptyAccum(): ProjectedTeamAccum {
  return { pj: 0, g: 0, e: 0, p: 0, gf: 0, ga: 0, gd: 0, pts: 0 }
}

export function buildGroupTeamAliasMap(
  groupToTeams: Map<string, string[]>,
  teamApiIdByCode: Map<string, number | null | undefined>,
): Map<string, Map<string, string>> {
  const aliasesByGroup = new Map<string, Map<string, string>>()

  for (const [groupCode, roster] of groupToTeams) {
    const aliases = new Map<string, string>()
    for (const teamCode of roster) {
      const canonical = teamCode.trim().toUpperCase()
      aliases.set(canonical, canonical)
      const apiId = teamApiIdByCode.get(canonical)
      if (apiId != null) aliases.set(String(apiId), canonical)
    }
    aliasesByGroup.set(groupCode, aliases)
  }

  return aliasesByGroup
}

export function resolveRosterTeamCode(
  groupCode: string,
  teamCode: string,
  groupToTeams: Map<string, string[]>,
  teamAliasesByGroup: Map<string, Map<string, string>>,
): string | null {
  const roster = groupToTeams.get(groupCode)
  if (!roster) return null

  const rosterByUpper = new Map(roster.map((code) => [code.trim().toUpperCase(), code]))
  const normalized = teamCode.trim().toUpperCase()
  const aliases = teamAliasesByGroup.get(groupCode)
  const canonicalUpper = (
    aliases?.get(normalized) ??
    aliases?.get(teamCode.trim()) ??
    normalized
  ).trim().toUpperCase()

  return rosterByUpper.get(canonicalUpper) ?? null
}

export function computeProjectedStandingRowsByGroup<Row>({
  groupToTeams,
  teamAliasesByGroup,
  matches,
  predictions,
  buildRow,
}: ComputeProjectedStandingRowsInput<Row>): Map<string, Row[]> {
  const aliasesByGroup = teamAliasesByGroup ?? buildGroupTeamAliasMap(groupToTeams, new Map())
  const predictionByMatchId = new Map(predictions.map((prediction) => [prediction.matchId, prediction]))
  const accumByGroup = new Map<string, Map<string, ProjectedTeamAccum>>()
  const resultsByGroup = new Map<string, GroupMatchResult[]>()

  for (const [groupCode, teams] of groupToTeams) {
    const groupAccum = new Map<string, ProjectedTeamAccum>()
    for (const teamCode of teams) {
      groupAccum.set(teamCode, emptyAccum())
    }
    accumByGroup.set(groupCode, groupAccum)
    resultsByGroup.set(groupCode, [])
  }

  for (const match of matches) {
    const prediction = predictionByMatchId.get(match.id)
    if (!prediction) continue

    const groupAccum = accumByGroup.get(match.groupCode)
    if (!groupAccum) continue

    const home = resolveRosterTeamCode(match.groupCode, match.home, groupToTeams, aliasesByGroup)
    const away = resolveRosterTeamCode(match.groupCode, match.away, groupToTeams, aliasesByGroup)
    if (!home || !away) continue

    const homeAccum = groupAccum.get(home)!
    const awayAccum = groupAccum.get(away)!

    homeAccum.pj += 1
    awayAccum.pj += 1
    homeAccum.gf += prediction.homeScore
    homeAccum.ga += prediction.awayScore
    awayAccum.gf += prediction.awayScore
    awayAccum.ga += prediction.homeScore
    homeAccum.gd = homeAccum.gf - homeAccum.ga
    awayAccum.gd = awayAccum.gf - awayAccum.ga

    if (prediction.homeScore > prediction.awayScore) {
      homeAccum.g += 1
      homeAccum.pts += 3
      awayAccum.p += 1
    } else if (prediction.homeScore === prediction.awayScore) {
      homeAccum.e += 1
      awayAccum.e += 1
      homeAccum.pts += 1
      awayAccum.pts += 1
    } else {
      awayAccum.g += 1
      awayAccum.pts += 3
      homeAccum.p += 1
    }

    resultsByGroup.get(match.groupCode)?.push({
      home,
      away,
      homeScore: prediction.homeScore,
      awayScore: prediction.awayScore,
    })
  }

  const rowsByGroup = new Map<string, Row[]>()
  for (const [groupCode, groupAccum] of accumByGroup) {
    const roster = groupToTeams.get(groupCode) ?? []
    const rosterStats = new Map(roster.map((teamCode) => [teamCode, groupAccum.get(teamCode) ?? emptyAccum()]))
    const sortedTeams = sortTeamsByOlympicTiebreak(rosterStats, resultsByGroup.get(groupCode) ?? [])
    const rows = sortedTeams.map((teamCode, index) => buildRow(teamCode, rosterStats.get(teamCode)!, index))
    rowsByGroup.set(groupCode, rows)
  }

  return rowsByGroup
}
