import type { GroupCode, GroupRankings } from "@/features/onboarding/types"

export type MatchPrediction = {
  match_id: string
  home_score: number
  away_score: number
}

export type MatchInfo = {
  id: string
  group_code: string | null
  home_team_code: string
  away_team_code: string
}

type TeamStats = {
  pts: number
  gf: number
  ga: number
  gd: number
}

const GROUPS: GroupCode[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]

function compareTeams(a: [string, TeamStats], b: [string, TeamStats]): number {
  if (b[1].pts !== a[1].pts) return b[1].pts - a[1].pts
  if (b[1].gd !== a[1].gd) return b[1].gd - a[1].gd
  if (b[1].gf !== a[1].gf) return b[1].gf - a[1].gf
  return a[0].localeCompare(b[0])
}

export function computeGroupStandings(
  predictions: MatchPrediction[],
  matches: MatchInfo[]
): GroupRankings {
  const predByMatchId = new Map<string, MatchPrediction>()
  for (const pred of predictions) {
    predByMatchId.set(pred.match_id, pred)
  }

  const statsByGroup = new Map<GroupCode, Map<string, TeamStats>>()

  for (const group of GROUPS) {
    statsByGroup.set(group, new Map())
  }

  for (const match of matches) {
    if (!match.group_code) continue
    const group = match.group_code as GroupCode
    if (!GROUPS.includes(group)) continue

    const groupStats = statsByGroup.get(group)
    if (!groupStats) continue

    if (!groupStats.has(match.home_team_code)) {
      groupStats.set(match.home_team_code, { pts: 0, gf: 0, ga: 0, gd: 0 })
    }
    if (!groupStats.has(match.away_team_code)) {
      groupStats.set(match.away_team_code, { pts: 0, gf: 0, ga: 0, gd: 0 })
    }

    const pred = predByMatchId.get(match.id)
    if (!pred) continue

    const homeStats = groupStats.get(match.home_team_code)!
    const awayStats = groupStats.get(match.away_team_code)!

    homeStats.gf += pred.home_score
    homeStats.ga += pred.away_score
    homeStats.gd += pred.home_score - pred.away_score

    awayStats.gf += pred.away_score
    awayStats.ga += pred.home_score
    awayStats.gd += pred.away_score - pred.home_score

    if (pred.home_score > pred.away_score) {
      homeStats.pts += 3
    } else if (pred.home_score === pred.away_score) {
      homeStats.pts += 1
      awayStats.pts += 1
    } else {
      awayStats.pts += 3
    }
  }

  const result = {} as GroupRankings
  for (const group of GROUPS) {
    const groupStats = statsByGroup.get(group) ?? new Map()
    const sorted = [...groupStats.entries()].sort(compareTeams)
    result[group] = [
      sorted[0]?.[0] ?? "",
      sorted[1]?.[0] ?? "",
      sorted[2]?.[0] ?? "",
      sorted[3]?.[0] ?? "",
    ]
  }
  return result
}
