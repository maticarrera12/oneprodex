import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import type { MatchPredictionState, PlayerDetail } from '@/features/predictions/types'

export async function getPredictionsForMatch(
  supabase: SupabaseClient<Database>,
  matchId: string,
  userId: string,
): Promise<MatchPredictionState> {
  const [predResult, playersResult, cleanSheetsResult] = await Promise.all([
    supabase
      .from('predictions')
      .select('home_score,away_score,edit_locked')
      .eq('user_id', userId)
      .eq('match_id', matchId)
      .maybeSingle(),
    supabase
      .from('prediction_players')
      .select('player_api_id,type')
      .eq('user_id', userId)
      .eq('match_id', matchId),
    supabase
      .from('prediction_clean_sheets')
      .select('team_code')
      .eq('user_id', userId)
      .eq('match_id', matchId),
  ])

  const score = predResult.data
    ? { home_score: predResult.data.home_score, away_score: predResult.data.away_score }
    : null

  const editLocked = predResult.data?.edit_locked ?? false

  const players = playersResult.data ?? []
  const scorerIds = players.filter((p) => p.type === 'SCORER').map((p) => p.player_api_id)
  const yellowCardIds = players.filter((p) => p.type === 'YELLOW_CARD').map((p) => p.player_api_id)
  const redCardIds = players.filter((p) => p.type === 'RED_CARD').map((p) => p.player_api_id)

  const cleanSheetCodes = (cleanSheetsResult.data ?? []).map((cs) => cs.team_code)

  return { score, scorerIds, yellowCardIds, redCardIds, cleanSheetCodes, editLocked }
}

export async function getPlayersForMatch(
  supabase: SupabaseClient<Database>,
  homeTeamCode: string,
  awayTeamCode: string,
): Promise<{ home: PlayerDetail[]; away: PlayerDetail[] }> {
  const { data } = await supabase
    .from('players')
    .select('api_id,name,position,photo_url,team_code')
    .in('team_code', [homeTeamCode, awayTeamCode])

  const rows = data ?? []
  const home = rows
    .filter((p) => p.team_code === homeTeamCode)
    .map((p) => ({ api_id: p.api_id, name: p.name, position: p.position, photo_url: p.photo_url }))
  const away = rows
    .filter((p) => p.team_code === awayTeamCode)
    .map((p) => ({ api_id: p.api_id, name: p.name, position: p.position, photo_url: p.photo_url }))

  return { home, away }
}
