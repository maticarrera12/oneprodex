import { fetchH2H, fetchLineups, fetchPredictions } from '@/lib/api-football/client'
import { mapH2H, mapLineup, mapPrediction } from '@/lib/api-football/mappers'
import { APIFootballError } from '@/lib/api-football/types'
import { createServiceClient } from '@/lib/supabase/service'
import { applyWorldCupSeasonKickoffFilter } from '@/lib/world-cup/season'
import { NextResponse } from 'next/server'

function guardAuth(request: Request): NextResponse | null {
  const syncSecret = process.env.SYNC_SECRET
  if (!syncSecret) {
    return NextResponse.json({ error: 'Missing SYNC_SECRET' }, { status: 500 })
  }

  const authorization = request.headers.get('authorization')
  if (authorization !== `Bearer ${syncSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}

export async function POST(request: Request) {
  const unauthorized = guardAuth(request)
  if (unauthorized) return unauthorized

  try {
    const supabase = createServiceClient()
    const now = new Date()
    const window48h = new Date(now.getTime() + 48 * 3_600_000).toISOString()

    // Phase 1: Predictions — UPCOMING matches in 48h window
    const matchesResult = await applyWorldCupSeasonKickoffFilter(
      supabase.from('matches').select('id,home_team_code,away_team_code,status'),
    )
      .gte('kickoff', now.toISOString())
      .lte('kickoff', window48h)

    const allMatches = (matchesResult as { data: Array<{ id: string; home_team_code: string; away_team_code: string; status: string }> | null }).data ?? []

    // Fetch already-stored prediction IDs to enforce the immutability invariant
    const storedResult = await supabase
      .from('match_predictions')
      .select('match_id')

    const storedIds = new Set(
      ((storedResult as { data: Array<{ match_id: string }> | null }).data ?? []).map((r) => r.match_id),
    )

    const missingMatches = allMatches.filter((m) => !storedIds.has(m.id))

    let predictions = 0
    let h2h = 0
    let failed = 0

    // Build a teamCodeMap from teams table — used for both H2H api_id lookups and lineup mapping.
    const teamsResult = await supabase.from('teams').select('api_id,code')
    const teamsData = (teamsResult as { data: Array<{ api_id: number | null; code: string }> | null }).data ?? []
    const teamCodeMap = new Map<number, string>(
      teamsData
        .filter((t): t is { api_id: number; code: string } => typeof t.api_id === 'number')
        .map((t) => [t.api_id, t.code]),
    )
    // Reverse map: team_code → api_id (for H2H fetch)
    const codeToApiId = new Map<string, number>(
      teamsData
        .filter((t): t is { api_id: number; code: string } => typeof t.api_id === 'number')
        .map((t) => [t.code, t.api_id]),
    )

    for (const match of missingMatches) {
      // Predictions fetch — independent from H2H
      try {
        const { data: predData } = await fetchPredictions(match.id)
        const item = predData.response[0] ?? null
        const row = mapPrediction(match.id, item)

        if (row) {
          // ignoreDuplicates compiles to ON CONFLICT DO NOTHING: the pre-kickoff
          // snapshot can never be overwritten, even by concurrent runs.
          const { error: writeError } = await supabase
            .from('match_predictions')
            .upsert([row], { onConflict: 'match_id', ignoreDuplicates: true })

          if (writeError) {
            failed++
          } else {
            predictions++
          }
        }
      } catch {
        failed++
      }

      // H2H fetch: requires both teams to have api_ids in the teams table.
      // H2H param uses API TEAM IDs (not codes). Runs independently from prediction.
      const homeApiId = codeToApiId.get(match.home_team_code)
      const awayApiId = codeToApiId.get(match.away_team_code)

      if (homeApiId !== undefined && awayApiId !== undefined) {
        try {
          const { data: h2hData } = await fetchH2H(homeApiId, awayApiId)
          const h2hRows = h2hData.response
            .map((m) => mapH2H(match.id, m, teamCodeMap))
            .filter((row): row is NonNullable<typeof row> => row !== null)

          if (h2hRows.length > 0) {
            const { error: h2hWriteError } = await supabase
              .from('match_h2h')
              .upsert(h2hRows, { onConflict: 'for_match_id,id', ignoreDuplicates: true })

            if (!h2hWriteError) {
              h2h += h2hRows.length
            } else {
              failed++
            }
          }
        } catch {
          failed++
        }
      }
    }

    // Phase 2: Lineups — UPCOMING matches in kickoff window [-10min, +70min]
    // Lineups change up to kickoff so we UPSERT (not DO NOTHING).
    const lineupWindowStart = new Date(now.getTime() - 10 * 60_000).toISOString()
    const lineupWindowEnd = new Date(now.getTime() + 70 * 60_000).toISOString()

    const lineupMatchesResult = await applyWorldCupSeasonKickoffFilter(
      supabase.from('matches').select('id'),
    )
      .gte('kickoff', lineupWindowStart)
      .lte('kickoff', lineupWindowEnd)
      .eq('status', 'UPCOMING')

    const lineupMatches = (lineupMatchesResult as { data: Array<{ id: string }> | null }).data ?? []

    let lineups = 0

    for (const match of lineupMatches) {
      try {
        const { data: lineupData } = await fetchLineups(match.id)
        const rows = lineupData.response.flatMap((lineup) => mapLineup(match.id, lineup, teamCodeMap))

        if (rows.length === 0) continue

        const { error: writeError } = await supabase
          .from('match_lineups')
          .upsert(rows, { onConflict: 'match_id,team_code,player_api_id' })

        if (writeError) {
          failed++
          continue
        }
        lineups += rows.length
      } catch {
        failed++
      }
    }

    return NextResponse.json({ predictions, h2h, lineups, failed }, { status: 200 })
  } catch (error) {
    if (error instanceof APIFootballError) {
      return NextResponse.json({ error: error.detail }, { status: error.status })
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
