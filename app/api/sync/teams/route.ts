import { fetchTeams } from '@/lib/api-football/client'
import { APIFootballError } from '@/lib/api-football/types'
import { mapTeam } from '@/lib/api-football/mappers'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

const WORLD_CUP_LEAGUE_ID = 1
const WORLD_CUP_SEASON = Number(process.env.FOOTBALL_SEASON ?? 2026)

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
  if (unauthorized) {
    return unauthorized
  }

  try {
    const { data } = await fetchTeams(WORLD_CUP_LEAGUE_ID, WORLD_CUP_SEASON)
    const rows = data.response.map((item) => mapTeam(item.team))
    const supabase = createServiceClient()

    const { error } = await supabase.from('teams').upsert(rows, {
      onConflict: 'code',
      ignoreDuplicates: false,
    })

    if (error) {
      return NextResponse.json({ updated: 0, failed: rows.length, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ updated: rows.length, failed: 0 }, { status: 200 })
  } catch (error) {
    if (error instanceof APIFootballError) {
      return NextResponse.json({ error: error.detail }, { status: error.status })
    }

    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
