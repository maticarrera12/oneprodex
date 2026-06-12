import { fetchFixtureById, fetchLiveFixtures } from '@/lib/api-football/client'
import { mapFixtureLiveUpdate } from '@/lib/api-football/mappers'
import { APIFootballError } from '@/lib/api-football/types'
import { createServiceClient } from '@/lib/supabase/service'
import { WORLD_CUP_LEAGUE_ID } from '@/lib/world-cup/season'
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

export async function GET(request: Request) {
  const unauthorized = guardAuth(request)
  if (unauthorized) {
    return unauthorized
  }

  try {
    const { data } = await fetchLiveFixtures(WORLD_CUP_LEAGUE_ID)
    const supabase = createServiceClient()

    const rows = data.response.map((fixture) => mapFixtureLiveUpdate(fixture))
    const updateResults = await Promise.all(
      rows.map((row) =>
        supabase
          .from('matches')
          .update({
            home_score: row.home_score,
            away_score: row.away_score,
            minute: row.minute,
            status: row.status,
          })
          .eq('id', row.id),
      ),
    )

    let failed = updateResults.filter((result) => result.error).length

    // Self-healing: a match marked LIVE in the DB but absent from the live
    // feed has ended (the feed drops matches at full time). Reconcile it
    // directly so LIVE→FINISHED doesn't depend on the fixtures cron.
    const liveIds = new Set(rows.map((row) => row.id))
    const { data: dbLiveMatches } = await supabase.from('matches').select('id').eq('status', 'LIVE')
    const stuck = (dbLiveMatches ?? []).filter((match) => !liveIds.has(match.id))

    let reconciled = 0
    for (const match of stuck) {
      try {
        const { data: fixtureData } = await fetchFixtureById(match.id)
        const fixture = fixtureData.response[0]
        if (!fixture) continue

        const row = mapFixtureLiveUpdate(fixture)
        const { error } = await supabase
          .from('matches')
          .update({
            home_score: row.home_score,
            away_score: row.away_score,
            minute: row.minute,
            status: row.status,
          })
          .eq('id', row.id)

        if (error) failed++
        else if (row.status !== 'LIVE') reconciled++
      } catch {
        failed++
      }
    }

    return NextResponse.json(
      { updated: rows.length - updateResults.filter((r) => r.error).length, failed, reconciled },
      { status: 200 },
    )
  } catch (error) {
    if (error instanceof APIFootballError) {
      return NextResponse.json({ error: error.detail }, { status: error.status })
    }

    if (error instanceof Error && error.message.startsWith('Unknown fixture status:')) {
      return NextResponse.json({ error: error.message }, { status: 422 })
    }

    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
