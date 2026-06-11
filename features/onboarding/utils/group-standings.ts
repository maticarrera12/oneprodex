import type { GroupCode, GroupRankings } from "@/features/onboarding/types"
import {
  sortTeamsByOlympicTiebreak,
  type GroupMatchResult,
  type TeamGroupStats,
} from "@/features/standings/utils/group-tiebreak"

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

type TeamStats = TeamGroupStats

const GROUPS: GroupCode[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]

export function computeGroupStandings(
  predictions: MatchPrediction[],
  matches: MatchInfo[]
): GroupRankings {
  const predByMatchId = new Map<string, MatchPrediction>()
  for (const pred of predictions) {
    predByMatchId.set(pred.match_id, pred)
  }

  const statsByGroup = new Map<GroupCode, Map<string, TeamStats>>()
  const resultsByGroup = new Map<GroupCode, GroupMatchResult[]>()

  for (const group of GROUPS) {
    statsByGroup.set(group, new Map())
    resultsByGroup.set(group, [])
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

    resultsByGroup.get(group)?.push({
      home: match.home_team_code,
      away: match.away_team_code,
      homeScore: pred.home_score,
      awayScore: pred.away_score,
    })

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
    const sorted = sortTeamsByOlympicTiebreak(groupStats, resultsByGroup.get(group) ?? [])
    result[group] = [
      sorted[0] ?? "",
      sorted[1] ?? "",
      sorted[2] ?? "",
      sorted[3] ?? "",
    ]
  }
  return result
}
