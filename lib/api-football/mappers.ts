import type {
  AFFixture,
  AFH2HMatch,
  AFLineupTeam,
  AFMatchEvent,
  AFPredictionItem,
  AFSquadPlayer,
  AFStanding,
  AFTeam,
  MatchEventRow,
  MatchH2HRow,
  MatchLineupRow,
  MatchLiveUpdateRow,
  MatchPredictionRow,
  MatchRow,
  PlayerRow,
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

export function mapPlayer(player: AFSquadPlayer, teamCode: string): PlayerRow {
  const dob = player.date_of_birth ?? (player.age ? `${new Date().getFullYear() - player.age}-07-01` : null)
  return {
    api_id: player.id,
    name: player.name,
    team_code: teamCode,
    position: player.position,
    photo_url: player.photo,
    date_of_birth: dob,
  }
}

export function mapMatchEvent(
  event: AFMatchEvent,
  matchId: string,
  teamCodeMap: Map<number, string>,
): MatchEventRow | null {
  let type: MatchEventRow['type']

  if (event.type === 'Goal') {
    if (event.detail === 'Own Goal') {
      type = 'OWN_GOAL'
    } else if (event.detail === 'Penalty') {
      type = 'PENALTY'
    } else {
      type = 'GOAL'
    }
  } else if (event.type === 'Card') {
    if (event.detail === 'Yellow Card') {
      type = 'YELLOW_CARD'
    } else if (event.detail === 'Red Card' || event.detail === 'Second Yellow card') {
      type = 'RED_CARD'
    } else {
      return null
    }
  } else {
    return null
  }

  const playerIdPart = event.player.id !== null ? String(event.player.id) : 'unknown'
  const id = `${matchId}-${event.time.elapsed}-${playerIdPart}-${type}`

  return {
    id,
    match_id: matchId,
    player_api_id: event.player.id,
    team_code: teamCodeMap.get(event.team.id) ?? null,
    type,
    minute: event.time.elapsed,
  }
}

function parsePct(raw: string): number {
  return parseInt(raw, 10)
}

export function mapPrediction(
  fixtureId: string,
  item: AFPredictionItem | null,
): MatchPredictionRow | null {
  if (!item) return null

  const { percent, advice } = item.predictions
  const home = parsePct(percent.home)
  const draw = parsePct(percent.draw)
  const away = parsePct(percent.away)

  // Quality gate: API-Football serves placeholder rows (uniform percentages,
  // "No predictions available") when its model has no output for a fixture.
  // Treat those as missing so the snapshot stays unset and the cron retries
  // until a real prediction exists — snapshots are immutable once stored.
  if (advice === 'No predictions available') return null
  if (home === draw && draw === away) return null

  return {
    match_id: fixtureId,
    home_pct: home,
    draw_pct: draw,
    away_pct: away,
    advice: advice ?? null,
    synced_at: new Date().toISOString(),
  }
}

export function mapLineup(
  fixtureId: string,
  lineup: AFLineupTeam,
  teamCodeMap: Map<number, string>,
): MatchLineupRow[] {
  const teamCode = teamCodeMap.get(lineup.team.id) ?? String(lineup.team.id)
  const synced_at = new Date().toISOString()

  const startRows: MatchLineupRow[] = lineup.startXI.map(({ player }) => ({
    match_id: fixtureId,
    team_code: teamCode,
    player_api_id: player.id,
    name: player.name,
    number: player.number ?? null,
    position: player.pos ?? null,
    grid: player.grid ?? null,
    is_substitute: false,
    synced_at,
  }))

  const subRows: MatchLineupRow[] = lineup.substitutes.map(({ player }) => ({
    match_id: fixtureId,
    team_code: teamCode,
    player_api_id: player.id,
    name: player.name,
    number: player.number ?? null,
    position: player.pos ?? null,
    grid: player.grid ?? null,
    is_substitute: true,
    synced_at,
  }))

  return [...startRows, ...subRows]
}

export function mapH2H(forMatchId: string, match: AFH2HMatch): MatchH2HRow {
  return {
    id: String(match.fixture.id),
    for_match_id: forMatchId,
    home_team_code: match.teams.home.code ?? String(match.teams.home.id),
    away_team_code: match.teams.away.code ?? String(match.teams.away.id),
    home_score: match.goals.home,
    away_score: match.goals.away,
    kickoff: match.fixture.date,
  }
}
