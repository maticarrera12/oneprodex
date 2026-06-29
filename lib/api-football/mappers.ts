import type {
  AFFixture,
  AFH2HMatch,
  AFLineupTeam,
  AFMatchEvent,
  AFOddsBookmaker,
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
  const penalty = fixture.score?.penalty ?? null

  return {
    id: String(fixture.fixture.id),
    home_team_code: teamCodeMap.get(fixture.teams.home.id) ?? String(fixture.teams.home.id),
    away_team_code: teamCodeMap.get(fixture.teams.away.id) ?? String(fixture.teams.away.id),
    home_score: fixture.goals.home,
    away_score: fixture.goals.away,
    home_pen_score: penalty?.home ?? null,
    away_pen_score: penalty?.away ?? null,
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

  // Stronger tell: comparison.total at 0%/0% means the model ran with NO
  // data — its "double chance" output is arbitrary (it once favored Qatar
  // over Switzerland). Reject until the model has real input.
  const total = item.comparison?.total
  if (total && parsePct(total.home) === 0 && parsePct(total.away) === 0) return null

  return {
    match_id: fixtureId,
    home_pct: home,
    draw_pct: draw,
    away_pct: away,
    advice: advice ?? null,
    synced_at: new Date().toISOString(),
  }
}

/**
 * Converts bookmaker odds to a MatchPredictionRow using implied probability averaging.
 *
 * Algorithm:
 * 1. For each bookmaker, find the "Match Winner" bet.
 * 2. Parse H/D/A odds → implied probability (1/odd), normalize so they sum to 1.
 * 3. Average the normalized probabilities across all valid bookmakers.
 * 4. Convert to integers 0–100 using largest-remainder rounding (sum guaranteed = 100).
 * 5. Return null if no bookmaker provides a valid "Match Winner" bet.
 */
export function mapOddsToPrediction(
  fixtureId: string,
  bookmakers: AFOddsBookmaker[],
): MatchPredictionRow | null {
  const accumulated = { home: 0, draw: 0, away: 0 }
  let validCount = 0

  for (const bookmaker of bookmakers) {
    const matchWinnerBet = bookmaker.bets.find((b) => b.name === 'Match Winner')
    if (!matchWinnerBet) continue

    const homeVal = matchWinnerBet.values.find((v) => v.value === 'Home')
    const drawVal = matchWinnerBet.values.find((v) => v.value === 'Draw')
    const awayVal = matchWinnerBet.values.find((v) => v.value === 'Away')

    if (!homeVal || !drawVal || !awayVal) continue

    const pH = 1 / parseFloat(homeVal.odd)
    const pD = 1 / parseFloat(drawVal.odd)
    const pA = 1 / parseFloat(awayVal.odd)
    const sum = pH + pD + pA

    if (!Number.isFinite(sum) || sum <= 0) continue

    accumulated.home += pH / sum
    accumulated.draw += pD / sum
    accumulated.away += pA / sum
    validCount++
  }

  if (validCount === 0) return null

  const avgHome = accumulated.home / validCount
  const avgDraw = accumulated.draw / validCount
  const avgAway = accumulated.away / validCount

  // Largest-remainder rounding: guarantees integers summing to exactly 100.
  const scaled = [
    { key: 'home' as const, value: avgHome * 100 },
    { key: 'draw' as const, value: avgDraw * 100 },
    { key: 'away' as const, value: avgAway * 100 },
  ]

  const floors = scaled.map((s) => ({ key: s.key, floor: Math.floor(s.value), remainder: s.value - Math.floor(s.value) }))
  const totalFloor = floors.reduce((acc, s) => acc + s.floor, 0)
  const remainder = 100 - totalFloor

  floors.sort((a, b) => b.remainder - a.remainder)
  for (let i = 0; i < remainder; i++) {
    floors[i].floor++
  }

  const pcts = Object.fromEntries(floors.map((f) => [f.key, f.floor])) as {
    home: number
    draw: number
    away: number
  }

  return {
    match_id: fixtureId,
    home_pct: pcts.home,
    draw_pct: pcts.draw,
    away_pct: pcts.away,
    advice: null,
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

const H2H_FINISHED_STATUS = new Set(['FT', 'AET', 'PEN'])

export function mapH2H(
  forMatchId: string,
  match: AFH2HMatch,
  teamCodeMap: Map<number, string>,
): MatchH2HRow | null {
  const fixtureId = String(match.fixture.id)

  if (fixtureId === forMatchId) return null

  const status = match.fixture.status?.short
  if (status && !H2H_FINISHED_STATUS.has(status)) return null

  if (match.goals.home === null || match.goals.away === null) return null

  const venueParts = [match.fixture.venue?.name, match.fixture.venue?.city].filter(Boolean)

  return {
    id: fixtureId,
    for_match_id: forMatchId,
    home_team_code: teamCodeMap.get(match.teams.home.id) ?? match.teams.home.code ?? String(match.teams.home.id),
    away_team_code: teamCodeMap.get(match.teams.away.id) ?? match.teams.away.code ?? String(match.teams.away.id),
    home_team_name: match.teams.home.name,
    away_team_name: match.teams.away.name,
    home_score: match.goals.home,
    away_score: match.goals.away,
    kickoff: match.fixture.date,
    league_name: match.league?.name ?? null,
    season: match.league?.season ?? null,
    round: match.league?.round ?? null,
    venue: venueParts.length > 0 ? venueParts.join(', ') : null,
  }
}
