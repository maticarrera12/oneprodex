import { fetchSquad } from '@/lib/api-football/client'
import { mapPlayer } from '@/lib/api-football/mappers'
import { APIFootballError } from '@/lib/api-football/types'
import { createServiceClient } from '@/lib/supabase/service'
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
    const { data: teamsData } = await supabase
      .from('teams')
      .select('api_id, code')
      .not('api_id', 'is', null)

    const teams = (teamsData ?? []).filter((t) => t.api_id !== null) as { api_id: number; code: string }[]

    const results = await Promise.allSettled(
      teams.map(async (team) => {
        const { data } = await fetchSquad(team.api_id)
        const players = data.response.flatMap((item) =>
          item.players.map((p) => mapPlayer(p, team.code))
        )
        if (players.length === 0) return 0
        const { error } = await supabase
          .from('players')
          .upsert(players, { onConflict: 'api_id', ignoreDuplicates: false })
        if (error) throw new Error(error.message)
        return players.length
      })
    )

    const updated = results
      .filter((r): r is PromiseFulfilledResult<number> => r.status === 'fulfilled')
      .reduce((sum, r) => sum + r.value, 0)
    const failed = results.filter((r) => r.status === 'rejected').length

    return NextResponse.json({ updated, failed }, { status: failed > 0 ? 500 : 200 })
  } catch (error) {
    if (error instanceof APIFootballError) {
      return NextResponse.json({ error: error.detail }, { status: error.status })
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
