import { fetchMatchEvents } from '@/lib/api-football/client'
import { mapMatchEvent } from '@/lib/api-football/mappers'
import { APIFootballError } from '@/lib/api-football/types'
import { createServiceClient } from '@/lib/supabase/service'
import { calcCardPts, calcCleanSheetPts, calcPlayerScorerPts, calcScorePts } from '@/features/predictions/utils/scoring'
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

    const [matchesResult, teamsResult] = await Promise.all([
      supabase.from('matches').select('*').eq('status', 'FINISHED'),
      supabase.from('teams').select('api_id,code').not('api_id', 'is', null),
    ])

    const matches = matchesResult.data ?? []
    const teamCodeMap = new Map<number, string>(
      (teamsResult.data ?? [])
        .filter((t) => t.api_id !== null)
        .map((t) => [t.api_id as number, t.code]),
    )

    let updated = 0
    let failed = 0

    for (const match of matches) {
      try {
        const { data: eventsData } = await fetchMatchEvents(match.id)
        const rawEvents = eventsData.response

        const eventRows = rawEvents
          .map((ev) => mapMatchEvent(ev, match.id, teamCodeMap))
          .filter((row): row is NonNullable<typeof row> => row !== null)

        if (eventRows.length > 0) {
          const { error: upsertError } = await supabase
            .from('match_events')
            .upsert(eventRows, { onConflict: 'id', ignoreDuplicates: false })

          if (upsertError) {
            failed++
            continue
          }
        }

        await scoreMatch(supabase, match, teamCodeMap)
        updated++
      } catch {
        failed++
      }
    }

    // Fire-and-forget achievements evaluation after scoring loop
    // Failure must not fail events sync
    fetch(
      new URL(
        '/api/sync/achievements',
        process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
      ).toString(),
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.SYNC_SECRET}` },
        signal: AbortSignal.timeout(10_000),
      },
    ).catch(() => {})

    return NextResponse.json({ updated, failed }, { status: 200 })
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

async function scoreMatch(
  supabase: ReturnType<typeof createServiceClient>,
  match: { id: string; home_score: number | null; away_score: number | null; home_team_code: string; away_team_code: string },
  teamCodeMap: Map<number, string>,
): Promise<void> {
  const [predsResult, eventsResult] = await Promise.all([
    supabase
      .from('predictions')
      .select('id,user_id,home_score,away_score')
      .eq('match_id', match.id),
    supabase
      .from('match_events')
      .select('player_api_id,type,team_code')
      .eq('match_id', match.id),
  ])

  const predictions = predsResult.data ?? []
  const events = eventsResult.data ?? []

  const goalScorerIds = events
    .filter((e) => e.type === 'GOAL' || e.type === 'PENALTY')
    .map((e) => e.player_api_id)
    .filter((id): id is number => id !== null)

  const yellowCardedIds = events
    .filter((e) => e.type === 'YELLOW_CARD')
    .map((e) => e.player_api_id)
    .filter((id): id is number => id !== null)

  const redCardedIds = events
    .filter((e) => e.type === 'RED_CARD' || e.type === 'Second Yellow card')
    .map((e) => e.player_api_id)
    .filter((id): id is number => id !== null)

  for (const pred of predictions) {
    const [playerPredResult, cleanSheetResult] = await Promise.all([
      supabase
        .from('prediction_players')
        .select('player_api_id,type')
        .eq('user_id', pred.user_id)
        .eq('match_id', match.id),
      supabase
        .from('prediction_clean_sheets')
        .select('team_code')
        .eq('user_id', pred.user_id)
        .eq('match_id', match.id),
    ])

    const playerPreds = playerPredResult.data ?? []
    const cleanSheets = cleanSheetResult.data ?? []

    const predictedScorerIds = playerPreds
      .filter((p) => p.type === 'SCORER')
      .map((p) => p.player_api_id)

    const predictedYellowCardIds = playerPreds
      .filter((p) => p.type === 'YELLOW_CARD')
      .map((p) => p.player_api_id)

    const predictedRedCardIds = playerPreds
      .filter((p) => p.type === 'RED_CARD')
      .map((p) => p.player_api_id)

    const predictedCleanSheetCodes = cleanSheets.map((cs) => cs.team_code)

    const scorePts = calcScorePts(
      { home_score: pred.home_score, away_score: pred.away_score },
      { home: match.home_score, away: match.away_score },
    )

    const scorerPts = calcPlayerScorerPts(predictedScorerIds, goalScorerIds)
    const cardPts = calcCardPts(predictedYellowCardIds, predictedRedCardIds, yellowCardedIds, redCardedIds)

    // Pass away_score as homeScore (= goals home conceded) and home_score as awayScore (= goals away conceded)
    const cleanSheetPts = calcCleanSheetPts(
      predictedCleanSheetCodes,
      match.home_team_code,
      match.away_team_code,
      match.away_score,
      match.home_score,
    )

    const totalPts = scorePts + scorerPts + cardPts + cleanSheetPts

    await supabase
      .from('predictions')
      .update({ points: totalPts })
      .eq('id', pred.id)
  }
}
