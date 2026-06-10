import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import type { MatchPredictionState, PlayerDetail } from '@/features/predictions/types'
import { summarizeConsensusPredictions } from '@/features/predictions/utils/consensus'

export type MatchConsensusPrediction = {
  userId: string
  displayName: string
  handle: string
  homeScore: number
  awayScore: number
  isYou: boolean
}

export type MatchConsensusGroup = {
  id: string
  name: string
  predictions: MatchConsensusPrediction[]
  summary: {
    count: number
    topScore: string | null
    topScoreCount: number
  }
}

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

export async function getMatchConsensusGroups(
  supabase: SupabaseClient<Database>,
  matchId: string,
  userId: string,
): Promise<MatchConsensusGroup[]> {
  const { data: myMemberships, error: membershipsError } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId)
    .order('joined_at', { ascending: true })

  if (membershipsError || !myMemberships || myMemberships.length === 0) return []

  const groupIds = myMemberships.map((membership) => membership.group_id)
  const [{ data: groups }, { data: groupMembers }] = await Promise.all([
    supabase.from('groups').select('id,name').in('id', groupIds),
    supabase.from('group_members').select('group_id,user_id').in('group_id', groupIds),
  ])

  const memberRows = groupMembers ?? []
  const memberIds = Array.from(new Set(memberRows.map((member) => member.user_id)))
  if (memberIds.length === 0) return []

  const [{ data: predictions }, { data: users }] = await Promise.all([
    supabase
      .from('predictions')
      .select('user_id,home_score,away_score')
      .eq('match_id', matchId)
      .in('user_id', memberIds),
    supabase.from('users').select('id,display_name,handle').in('id', memberIds),
  ])

  const userById = new Map((users ?? []).map((user) => [user.id, user] as const))
  const predictionsByUserId = new Map((predictions ?? []).map((prediction) => [prediction.user_id, prediction] as const))
  const groupsById = new Map((groups ?? []).map((group) => [group.id, group] as const))

  return groupIds.flatMap((groupId) => {
    const group = groupsById.get(groupId)
    if (!group) return []

    const groupPredictions = memberRows
      .filter((member) => member.group_id === groupId)
      .flatMap((member): MatchConsensusPrediction[] => {
        const prediction = predictionsByUserId.get(member.user_id)
        const user = userById.get(member.user_id)
        if (!prediction || !user) return []

        return [{
          userId: member.user_id,
          displayName: member.user_id === userId ? 'Vos' : user.display_name,
          handle: user.handle,
          homeScore: prediction.home_score,
          awayScore: prediction.away_score,
          isYou: member.user_id === userId,
        }]
      })

    return [{
      id: group.id,
      name: group.name,
      predictions: groupPredictions,
      summary: summarizeConsensusPredictions(groupPredictions),
    }]
  })
}
