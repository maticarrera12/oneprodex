export type TeamGroupStats = {
  pts: number
  gf: number
  ga: number
  gd: number
}

export type GroupMatchResult = {
  home: string
  away: string
  homeScore: number
  awayScore: number
}

function emptyStats(): TeamGroupStats {
  return { pts: 0, gf: 0, ga: 0, gd: 0 }
}

function applyResult(
  statsMap: Map<string, TeamGroupStats>,
  home: string,
  away: string,
  homeScore: number,
  awayScore: number,
) {
  if (!statsMap.has(home)) statsMap.set(home, emptyStats())
  if (!statsMap.has(away)) statsMap.set(away, emptyStats())

  const homeStats = statsMap.get(home)!
  const awayStats = statsMap.get(away)!

  homeStats.gf += homeScore
  homeStats.ga += awayScore
  homeStats.gd += homeScore - awayScore

  awayStats.gf += awayScore
  awayStats.ga += homeScore
  awayStats.gd += awayScore - homeScore

  if (homeScore > awayScore) {
    homeStats.pts += 3
  } else if (homeScore === awayScore) {
    homeStats.pts += 1
    awayStats.pts += 1
  } else {
    awayStats.pts += 3
  }
}

function computeMiniLeagueStats(
  teams: string[],
  matches: GroupMatchResult[],
): Map<string, TeamGroupStats> {
  const teamSet = new Set(teams)
  const statsMap = new Map<string, TeamGroupStats>()

  for (const team of teams) {
    statsMap.set(team, emptyStats())
  }

  for (const result of matches) {
    if (!teamSet.has(result.home) || !teamSet.has(result.away)) continue
    applyResult(statsMap, result.home, result.away, result.homeScore, result.awayScore)
  }

  return statsMap
}

function miniStatsEqual(a: TeamGroupStats, b: TeamGroupStats): boolean {
  return a.pts === b.pts && a.gd === b.gd && a.gf === b.gf
}

function compareMiniStats(a: TeamGroupStats, b: TeamGroupStats): number {
  if (b.pts !== a.pts) return b.pts - a.pts
  if (b.gd !== a.gd) return b.gd - a.gd
  if (b.gf !== a.gf) return b.gf - a.gf
  return 0
}

function compareOverallStats(a: TeamGroupStats, b: TeamGroupStats): number {
  if (b.gd !== a.gd) return b.gd - a.gd
  if (b.gf !== a.gf) return b.gf - a.gf
  return 0
}

function sortTiedTeams(
  tiedTeams: string[],
  fullStats: Map<string, TeamGroupStats>,
  matches: GroupMatchResult[],
): string[] {
  if (tiedTeams.length <= 1) return tiedTeams

  const miniStats = computeMiniLeagueStats(tiedTeams, matches)
  const sorted = [...tiedTeams].sort((a, b) => {
    const miniCompare = compareMiniStats(miniStats.get(a)!, miniStats.get(b)!)
    if (miniCompare !== 0) return miniCompare

    const overallCompare = compareOverallStats(fullStats.get(a)!, fullStats.get(b)!)
    if (overallCompare !== 0) return overallCompare

    return a.localeCompare(b)
  })

  const result: string[] = []
  let index = 0

  while (index < sorted.length) {
    let next = index + 1
    while (next < sorted.length && miniStatsEqual(miniStats.get(sorted[index])!, miniStats.get(sorted[next])!)) {
      next++
    }

    const group = sorted.slice(index, next)
    if (group.length > 1 && tiedTeams.length > group.length) {
      result.push(...sortTiedTeams(group, fullStats, matches))
    } else {
      result.push(...group)
    }

    index = next
  }

  return result
}

export function sortTeamsByOlympicTiebreak(
  teamStats: Map<string, TeamGroupStats>,
  matches: GroupMatchResult[],
): string[] {
  const teams = [...teamStats.keys()]
  const byPoints = [...teams].sort((a, b) => teamStats.get(b)!.pts - teamStats.get(a)!.pts)

  const ranked: string[] = []
  let index = 0

  while (index < byPoints.length) {
    let next = index + 1
    while (next < byPoints.length && teamStats.get(byPoints[next])!.pts === teamStats.get(byPoints[index])!.pts) {
      next++
    }

    const tied = byPoints.slice(index, next)
    ranked.push(...(tied.length > 1 ? sortTiedTeams(tied, teamStats, matches) : tied))
    index = next
  }

  return ranked
}
