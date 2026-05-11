import type {
  APIFootballEnvelope,
  APIFootballErrorPayload,
  AFFixturesResponse,
  AFMatchEventsResponse,
  AFSquadResponse,
  AFStandingsResponse,
  AFTeamsResponse,
} from '@/lib/api-football/types'
import { APIFootballError } from '@/lib/api-football/types'

const API_FOOTBALL_BASE_URL = 'https://v3.football.api-sports.io'

function requireEnv(name: 'FOOTBALL_API_KEY'): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing ${name}`)
  }

  return value
}

function toSearchParams(params: Record<string, string | number | boolean | undefined>): URLSearchParams {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) {
      continue
    }

    searchParams.set(key, String(value))
  }

  return searchParams
}

async function parseErrorDetail(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as APIFootballErrorPayload
    if (typeof payload.message === 'string' && payload.message.length > 0) {
      return payload.message
    }

    if (payload.errors !== undefined) {
      return JSON.stringify(payload.errors)
    }
  } catch {
    return response.statusText || 'Unknown API-Football error'
  }

  return response.statusText || 'Unknown API-Football error'
}

function parseRemainingRequests(response: Response): number | null {
  const rawValue = response.headers.get('x-ratelimit-requests-remaining')
  if (!rawValue) {
    return null
  }

  const parsed = Number.parseInt(rawValue, 10)
  return Number.isNaN(parsed) ? null : parsed
}

export async function apiFetch<T>(
  path: string,
  params: Record<string, string | number | boolean | undefined>,
): Promise<APIFootballEnvelope<T>> {
  const apiKey = requireEnv('FOOTBALL_API_KEY')
  const url = new URL(path, API_FOOTBALL_BASE_URL)
  url.search = toSearchParams(params).toString()

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-apisports-key': apiKey,
      Accept: 'application/json',
    },
    cache: 'no-store',
  })

  const remainingRequests = parseRemainingRequests(response)

  if (!response.ok) {
    const detail = await parseErrorDetail(response)
    throw new APIFootballError(response.status, detail)
  }

  const data = (await response.json()) as T
  return { data, remainingRequests }
}

export function fetchTeams(leagueId: number, season: number): Promise<APIFootballEnvelope<AFTeamsResponse>> {
  return apiFetch<AFTeamsResponse>('/teams', { league: leagueId, season })
}

export function fetchFixtures(leagueId: number, season: number): Promise<APIFootballEnvelope<AFFixturesResponse>> {
  return apiFetch<AFFixturesResponse>('/fixtures', { league: leagueId, season })
}

export function fetchLiveFixtures(leagueId: number): Promise<APIFootballEnvelope<AFFixturesResponse>> {
  return apiFetch<AFFixturesResponse>('/fixtures', { league: leagueId, live: 'all' })
}

export function fetchStandings(leagueId: number, season: number): Promise<APIFootballEnvelope<AFStandingsResponse>> {
  return apiFetch<AFStandingsResponse>('/standings', { league: leagueId, season })
}

export function fetchSquad(teamId: number): Promise<APIFootballEnvelope<AFSquadResponse>> {
  return apiFetch<AFSquadResponse>('/players/squads', { team: teamId })
}

export function fetchMatchEvents(fixtureId: string): Promise<APIFootballEnvelope<AFMatchEventsResponse>> {
  return apiFetch<AFMatchEventsResponse>('/fixtures/events', { fixture: fixtureId })
}
