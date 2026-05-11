import { fetchLiveFixtures } from '@/lib/api-football/client'
import { mapFixtureLiveUpdate } from '@/lib/api-football/mappers'
import { APIFootballError } from '@/lib/api-football/types'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

const WORLD_CUP_LEAGUE_ID = 1

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

    if (data.response.length === 0) {
      return NextResponse.json({ updated: 0, failed: 0 }, { status: 200 })
    }

    const rows = data.response.map((fixture) => mapFixtureLiveUpdate(fixture))
    const supabase = createServiceClient()
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

    const failed = updateResults.filter((result) => result.error).length
    return NextResponse.json({ updated: rows.length - failed, failed }, { status: failed > 0 ? 500 : 200 })
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
