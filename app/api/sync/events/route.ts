import { fetchMatchEvents } from '@/lib/api-football/client'
import { mapMatchEvent } from '@/lib/api-football/mappers'
import { APIFootballError } from '@/lib/api-football/types'
import { createServiceClient } from '@/lib/supabase/service'
import { calcCardPts, calcCleanSheetPts, calcPlayerScorerPts, calcScorePts, calcUpsetBonus } from '@/features/predictions/utils/scoring'
import { UPSET_ELIGIBILITY_GAP } from '@/features/scoring/constants'
import { scoreBracketForMatch } from '@/features/scoring/sync-bracket'
import { evaluateAllUsers } from '@/lib/achievements/evaluate'
import { applyWorldCupSeasonKickoffFilter } from '@/lib/world-cup/season'
import { NextResponse } from 'next/server'

// Window in which a finished match keeps being re-scored, so late event
// corrections from API-Football are picked up. Outside it, only matches
// never marked scored_at are processed — this keeps the cron cost flat
// instead of growing with every finished match of the tournament.
const RESCORE_WINDOW_HOURS = 24

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
    const rescoreCutoff = new Date(Date.now() - RESCORE_WINDOW_HOURS * 3_600_000).toISOString()

    const [matchesResult, teamsResult] = await Promise.all([
      applyWorldCupSeasonKickoffFilter(supabase.from('matches').select('*'))
        .eq('status', 'FINISHED')
        .or(`scored_at.is.null,kickoff.gte.${rescoreCutoff}`),
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

        const scoredOk = await scoreMatch(supabase, match)
        if (!scoredOk) {
          failed++
          continue
        }

        await supabase
          .from('matches')
          .update({ scored_at: new Date().toISOString() })
          .eq('id', match.id)
        updated++
      } catch {
        failed++
      }
    }

    if (updated > 0) {
      await evaluateAllUsers(supabase)
    }

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

type PlayerPredRow = { user_id: string; player_api_id: number; type: string }
type CleanSheetRow = { user_id: string; team_code: string }

function groupByUser<T extends { user_id: string }>(rows: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const row of rows) {
    const list = map.get(row.user_id)
    if (list) list.push(row)
    else map.set(row.user_id, [row])
  }
  return map
}

async function scoreMatch(
  supabase: ReturnType<typeof createServiceClient>,
  match: {
    id: string
    home_score: number | null
    away_score: number | null
    home_team_code: string
    away_team_code: string
    status: string
    kickoff: string | null
    stage: string
  },
): Promise<boolean> {
  const [predsResult, eventsResult, playerPredsResult, cleanSheetsResult] = await Promise.all([
    supabase
      .from('predictions')
      .select('id,user_id,home_score,away_score')
      .eq('match_id', match.id),
    supabase
      .from('match_events')
      .select('player_api_id,type,team_code')
      .eq('match_id', match.id),
    supabase
      .from('prediction_players')
      .select('user_id,player_api_id,type')
      .eq('match_id', match.id),
    supabase
      .from('prediction_clean_sheets')
      .select('user_id,team_code')
      .eq('match_id', match.id),
  ])

  if (predsResult.error || eventsResult.error || playerPredsResult.error || cleanSheetsResult.error) {
    return false
  }

  // Read the pre-match odds snapshot for upset bonus eligibility (gap-based)
  const { data: matchPrediction } = await supabase
    .from('match_predictions')
    .select('home_pct,away_pct')
    .eq('match_id', match.id)
    .maybeSingle()

  const predictions = predsResult.data ?? []
  const events = eventsResult.data ?? []
  const playerPredsByUser = groupByUser((playerPredsResult.data ?? []) as PlayerPredRow[])
  const cleanSheetsByUser = groupByUser((cleanSheetsResult.data ?? []) as CleanSheetRow[])

  const goalScorerIds = events
    .filter((e) => e.type === 'GOAL' || e.type === 'PENALTY')
    .map((e) => e.player_api_id)
    .filter((id): id is number => id !== null)

  const yellowCardedIds = events
    .filter((e) => e.type === 'YELLOW_CARD')
    .map((e) => e.player_api_id)
    .filter((id): id is number => id !== null)

  const redCardedIds = events
    .filter((e) => e.type === 'RED_CARD')
    .map((e) => e.player_api_id)
    .filter((id): id is number => id !== null)

  let allUpdatesOk = true

  for (const pred of predictions) {
    const playerPreds = playerPredsByUser.get(pred.user_id) ?? []
    const cleanSheets = cleanSheetsByUser.get(pred.user_id) ?? []

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

    const upsetBonus = (() => {
      if (!matchPrediction) return 0
      const { home_pct, away_pct } = matchPrediction
      // Gap-based eligibility (AUTHORITATIVE — decision #498): abs(home_pct - away_pct) >= 15
      if (Math.abs(home_pct - away_pct) < UPSET_ELIGIBILITY_GAP) return 0
      // Draw result never qualifies
      if (match.home_score === match.away_score) return 0
      // Identify which side is the underdog (lower implied %)
      const actualWinner = match.home_score! > match.away_score! ? 'home' : 'away'
      const underdogSide = home_pct < away_pct ? 'home' : 'away'
      // Only an upset when the underdog (lower-pct side) won
      if (actualWinner !== underdogSide) return 0
      // User must have predicted the upset winner (not a draw prediction)
      const userPredWinner =
        pred.home_score > pred.away_score ? 'home' : pred.home_score < pred.away_score ? 'away' : 'draw'
      if (userPredWinner !== actualWinner) return 0
      // Compute bonus from the winner's implied probability
      const winnerPct = actualWinner === 'home' ? home_pct : away_pct
      return calcUpsetBonus(winnerPct)
    })()

    const totalPts = scorePts + scorerPts + cardPts + cleanSheetPts + upsetBonus

    const { error: updateError } = await supabase
      .from('predictions')
      .update({ points: totalPts })
      .eq('id', pred.id)

    if (updateError) {
      allUpdatesOk = false
    }
  }

  await scoreBracketForMatch(supabase, match)

  return allUpdatesOk
}
