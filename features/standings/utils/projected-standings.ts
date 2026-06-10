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
  matches: ProjectedMatch[]
  predictions: ProjectedPrediction[]
  buildRow: (teamCode: string, accum: ProjectedTeamAccum, position: number) => Row
}

function emptyAccum(): ProjectedTeamAccum {
  return { pj: 0, g: 0, e: 0, p: 0, gf: 0, ga: 0, gd: 0, pts: 0 }
}

function compareRows(a: [string, ProjectedTeamAccum], b: [string, ProjectedTeamAccum]): number {
  return b[1].pts - a[1].pts || b[1].gd - a[1].gd || b[1].gf - a[1].gf
}

export function computeProjectedStandingRowsByGroup<Row>({
  groupToTeams,
  matches,
  predictions,
  buildRow,
}: ComputeProjectedStandingRowsInput<Row>): Map<string, Row[]> {
  const predictionByMatchId = new Map(predictions.map((prediction) => [prediction.matchId, prediction]))
  const accumByGroup = new Map<string, Map<string, ProjectedTeamAccum>>()

  for (const [groupCode, teams] of groupToTeams) {
    const groupAccum = new Map<string, ProjectedTeamAccum>()
    for (const teamCode of teams) {
      groupAccum.set(teamCode, emptyAccum())
    }
    accumByGroup.set(groupCode, groupAccum)
  }

  for (const match of matches) {
    const prediction = predictionByMatchId.get(match.id)
    if (!prediction) continue

    const groupAccum = accumByGroup.get(match.groupCode)
    if (!groupAccum) continue

    if (!groupAccum.has(match.home)) groupAccum.set(match.home, emptyAccum())
    if (!groupAccum.has(match.away)) groupAccum.set(match.away, emptyAccum())

    const homeAccum = groupAccum.get(match.home)!
    const awayAccum = groupAccum.get(match.away)!

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
  }

  const rowsByGroup = new Map<string, Row[]>()
  for (const [groupCode, groupAccum] of accumByGroup) {
    const rows = Array.from(groupAccum.entries())
      .sort(compareRows)
      .map(([teamCode, accum], index) => buildRow(teamCode, accum, index))
    rowsByGroup.set(groupCode, rows)
  }

  return rowsByGroup
}
