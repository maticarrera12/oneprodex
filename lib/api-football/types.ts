export type SyncMatchStatus = 'UPCOMING' | 'LIVE' | 'FINISHED'

export interface APIFootballEnvelope<T> {
  data: T
  remainingRequests: number | null
}

export interface APIFootballErrorPayload {
  message?: string
  errors?: unknown
}

export class APIFootballError extends Error {
  readonly status: number
  readonly detail: string

  constructor(status: number, detail: string) {
    super(`API-Football request failed with status ${status}`)
    this.name = 'APIFootballError'
    this.status = status
    this.detail = detail
  }
}

export interface AFTeamColors {
  player?: {
    primary?: string | null
    number?: string | null
    border?: string | null
  } | null
}

export interface AFTeam {
  id: number
  name: string
  code: string | null
  logo?: string | null
  colors?: AFTeamColors | null
}

export interface AFTeamsResponseItem {
  team: AFTeam
}

export interface AFTeamsResponse {
  response: AFTeamsResponseItem[]
}

export interface AFFixtureStatus {
  short: string
  elapsed: number | null
}

export interface AFFixtureVenue {
  name: string | null
}

export interface AFFixtureInfo {
  id: number
  date: string
  status: AFFixtureStatus
  venue?: AFFixtureVenue | null
}

export interface AFFixtureTeam {
  id: number
  code: string | null
  name?: string
}

export interface AFFixture {
  fixture: AFFixtureInfo
  league: {
    round: string
    group: string | null
  }
  teams: {
    home: AFFixtureTeam
    away: AFFixtureTeam
  }
  goals: {
    home: number | null
    away: number | null
  }
}

export interface AFFixturesResponse {
  response: AFFixture[]
}

export interface AFStanding {
  rank: number
  team: {
    id: number
    name: string
    code: string | null
  }
  group: string
  points: number
  goalsDiff: number
  all: {
    played: number
    win: number
    draw: number
    lose: number
    goals: {
      for: number
      against: number
    }
  }
}

export interface AFStandingsLeague {
  standings: AFStanding[][]
}

export interface AFStandingsResponseItem {
  league: AFStandingsLeague
}

export interface AFStandingsResponse {
  response: AFStandingsResponseItem[]
}

export interface TeamRow {
  code: string
  name: string
  api_id: number
  logo: string | null
  c1: string | null
  c2: string | null
  c3: string | null
}

export interface MatchRow {
  id: string
  home_team_code: string
  away_team_code: string
  home_score: number | null
  away_score: number | null
  status: SyncMatchStatus
  minute: number | null
  kickoff: string
  stage: string
  group_code: string | null
}

export interface MatchLiveUpdateRow {
  id: string
  home_score: number | null
  away_score: number | null
  minute: number | null
  status: SyncMatchStatus
}

export interface StandingRow {
  team_code: string
  group_code: string
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  points: number
}

export interface AFSquadPlayer {
  id: number
  name: string
  age: number
  date_of_birth: string | null
  number: number | null
  position: string
  photo: string | null
}

export interface AFSquadItem {
  team: AFTeam
  players: AFSquadPlayer[]
}

export interface AFSquadResponse {
  response: AFSquadItem[]
}

export interface AFMatchEventTeam {
  id: number
  name: string
}

export interface AFMatchEventPlayer {
  id: number | null
  name: string | null
}

export interface AFMatchEvent {
  time: {
    elapsed: number
    extra: number | null
  }
  team: AFMatchEventTeam
  player: AFMatchEventPlayer
  assist: AFMatchEventPlayer
  type: string
  detail: string
}

export interface AFMatchEventsResponse {
  response: AFMatchEvent[]
}

export interface PlayerRow {
  api_id: number
  name: string
  team_code: string | null
  position: string | null
  photo_url: string | null
  date_of_birth: string | null
}

export interface MatchEventRow {
  id: string
  match_id: string
  player_api_id: number | null
  team_code: string | null
  type: 'GOAL' | 'OWN_GOAL' | 'PENALTY' | 'YELLOW_CARD' | 'RED_CARD'
  minute: number | null
}

// ─── Predictions ─────────────────────────────────────────────────────────────

export interface AFPredictionPercent {
  home: string
  draw: string
  away: string
}

export interface AFPredictionItem {
  predictions: {
    percent: AFPredictionPercent
    advice: string
  }
  comparison?: {
    total?: { home: string; away: string }
  }
}

export interface AFPredictionsResponse {
  response: AFPredictionItem[]
}

export interface MatchPredictionRow {
  match_id: string
  home_pct: number
  draw_pct: number
  away_pct: number
  advice: string | null
  synced_at: string
}

// ─── Lineups ──────────────────────────────────────────────────────────────────

export interface AFLineupPlayer {
  id: number
  name: string
  number: number
  pos: string
  grid: string | null
}

export interface AFLineupTeam {
  team: {
    id: number
    name: string
  }
  formation: string
  startXI: Array<{ player: AFLineupPlayer }>
  substitutes: Array<{ player: AFLineupPlayer }>
}

export interface AFLineupsResponse {
  response: AFLineupTeam[]
}

export interface MatchLineupRow {
  match_id: string
  team_code: string
  player_api_id: number
  name: string
  number: number | null
  position: string | null
  grid: string | null
  is_substitute: boolean
  synced_at: string
}

// ─── H2H ─────────────────────────────────────────────────────────────────────

export interface AFH2HFixture {
  id: number
  date: string
  status?: { short: string }
  venue?: { name?: string | null; city?: string | null }
}

export interface AFH2HLeague {
  name?: string
  season?: number
  round?: string
}

export interface AFH2HTeam {
  id: number
  name: string
  code: string | null
  logo?: string | null
}

export interface AFH2HMatch {
  fixture: AFH2HFixture
  league?: AFH2HLeague
  teams: {
    home: AFH2HTeam
    away: AFH2HTeam
  }
  goals: {
    home: number | null
    away: number | null
  }
}

export interface AFH2HResponse {
  response: AFH2HMatch[]
}

export interface MatchH2HRow {
  id: string
  for_match_id: string
  home_team_code: string
  away_team_code: string
  home_team_name?: string | null
  away_team_name?: string | null
  home_score: number | null
  away_score: number | null
  kickoff: string
  league_name?: string | null
  season?: number | null
  round?: string | null
  venue?: string | null
  /** Enriched on read — not persisted */
  homeLogo?: string | null
  awayLogo?: string | null
}
