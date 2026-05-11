import type {
  AFFixture,
  AFStanding,
  AFTeam,
  MatchLiveUpdateRow,
  MatchRow,
  StandingRow,
  SyncMatchStatus,
  TeamRow,
} from '@/lib/api-football/types'

const UPCOMING_STATUS_CODES = new Set(['NS', 'TBD'])
const LIVE_STATUS_CODES = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'SUSP', 'INT', 'LIVE'])
const FINISHED_STATUS_CODES = new Set(['FT', 'AET', 'PEN', 'PST', 'CANC', 'ABD', 'AWD', 'WO'])

function requireStandingTeamCode(code: string | null): string {
  if (!code) {
    throw new Error('Missing standing team code')
  }

  return code
}

export function mapFixtureStatus(short: string): SyncMatchStatus {
  if (UPCOMING_STATUS_CODES.has(short)) {
    return 'UPCOMING'
  }

  if (LIVE_STATUS_CODES.has(short)) {
    return 'LIVE'
  }

  if (FINISHED_STATUS_CODES.has(short)) {
    return 'FINISHED'
  }

  throw new Error(`Unknown fixture status: ${short}`)
}

export function mapTeam(team: AFTeam): TeamRow {
  return {
    code: team.code ?? String(team.id),
    name: team.name,
    api_id: team.id,
    logo: team.logo ?? null,
    c1: team.colors?.player?.primary ?? null,
    c2: team.colors?.player?.number ?? null,
    c3: team.colors?.player?.border ?? null,
  }
}

export function mapFixture(fixture: AFFixture, teamCodeMap: Map<number, string>): MatchRow {
  const status = mapFixtureStatus(fixture.fixture.status.short)

  return {
    id: String(fixture.fixture.id),
    home_team_code: teamCodeMap.get(fixture.teams.home.id) ?? String(fixture.teams.home.id),
    away_team_code: teamCodeMap.get(fixture.teams.away.id) ?? String(fixture.teams.away.id),
    home_score: fixture.goals.home,
    away_score: fixture.goals.away,
    status,
    minute: fixture.fixture.status.elapsed,
    kickoff: fixture.fixture.date,
    stage: fixture.league.round,
    group_code: fixture.league.group ?? null,
  }
}

export function mapFixtureLiveUpdate(fixture: AFFixture): MatchLiveUpdateRow {
  return {
    id: String(fixture.fixture.id),
    home_score: fixture.goals.home,
    away_score: fixture.goals.away,
    minute: fixture.fixture.status.elapsed,
    status: mapFixtureStatus(fixture.fixture.status.short),
  }
}

export function mapStanding(standing: AFStanding): StandingRow {
  return {
    team_code: standing.team.code ?? String(standing.team.id),
    group_code: standing.group,
    played: standing.all.played,
    won: standing.all.win,
    drawn: standing.all.draw,
    lost: standing.all.lose,
    goals_for: standing.all.goals.for,
    goals_against: standing.all.goals.against,
    points: standing.points,
  }
}
