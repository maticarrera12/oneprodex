'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const SIMULATED_NOW = process.env.SIMULATED_NOW
const SIMULATED_MATCH_WINDOW_MINUTES = 130

function getReferenceNow(): Date | null {
  if (!SIMULATED_NOW) return null
  const parsed = new Date(SIMULATED_NOW)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function deriveStatusFromKickoff(status: string, kickoff: string, now: Date | null): string {
  if (!now) return status
  const kickoffDate = new Date(kickoff)
  if (Number.isNaN(kickoffDate.getTime())) return status
  if (now.getTime() < kickoffDate.getTime()) return 'UPCOMING'
  const liveEndsAt = kickoffDate.getTime() + SIMULATED_MATCH_WINDOW_MINUTES * 60_000
  if (now.getTime() <= liveEndsAt) return 'LIVE'
  return 'FINISHED'
}

async function getMatchStatus(matchId: string): Promise<string | null> {
  const supabase = createServiceClient()
  const { data } = await supabase.from('matches').select('status,kickoff').eq('id', matchId).maybeSingle()
  if (!data) return null
  return deriveStatusFromKickoff(data.status, data.kickoff, getReferenceNow())
}

export async function savePrediction(formData: FormData): Promise<void> {
  const matchId = formData.get('match_id') as string
  const homeScore = Number(formData.get('home_score'))
  const awayScore = Number(formData.get('away_score'))

  const status = await getMatchStatus(matchId)
  if (status !== 'UPCOMING') return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const serviceClient = createServiceClient()
  await serviceClient.from('predictions').upsert(
    { user_id: user.id, match_id: matchId, home_score: homeScore, away_score: awayScore },
    { onConflict: 'user_id,match_id' },
  )

  const { data: matchTeams } = await serviceClient
    .from('matches')
    .select('home_team_code,away_team_code')
    .eq('id', matchId)
    .maybeSingle()

  if (matchTeams) {
    await serviceClient
      .from('prediction_clean_sheets')
      .delete()
      .eq('user_id', user.id)
      .eq('match_id', matchId)

    const cleanSheetsToInsert: Array<{ user_id: string; match_id: string; team_code: string }> = []
    if (awayScore === 0) {
      cleanSheetsToInsert.push({ user_id: user.id, match_id: matchId, team_code: matchTeams.home_team_code })
    }
    if (homeScore === 0) {
      cleanSheetsToInsert.push({ user_id: user.id, match_id: matchId, team_code: matchTeams.away_team_code })
    }

    if (cleanSheetsToInsert.length > 0) {
      await serviceClient
        .from('prediction_clean_sheets')
        .insert(cleanSheetsToInsert)
    }
  }

  revalidatePath(`/partidos/${matchId}`)
}

export async function toggleScorerPrediction(formData: FormData): Promise<void> {
  const matchId = formData.get('match_id') as string
  const playerApiId = Number(formData.get('player_api_id'))

  const status = await getMatchStatus(matchId)
  if (status !== 'UPCOMING') return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const serviceClient = createServiceClient()
  const { data: existing } = await serviceClient
    .from('prediction_players')
    .select('id')
    .eq('user_id', user.id)
    .eq('match_id', matchId)
    .eq('player_api_id', playerApiId)
    .eq('type', 'SCORER')
    .maybeSingle()

  if (existing) {
    await serviceClient.from('prediction_players').delete().eq('id', existing.id)
  } else {
    const { count } = await serviceClient
      .from('prediction_players')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('match_id', matchId)
      .eq('type', 'SCORER')

    if ((count ?? 0) >= 3) return

    await serviceClient.from('prediction_players').insert({
      user_id: user.id,
      match_id: matchId,
      player_api_id: playerApiId,
      type: 'SCORER',
    })
  }

  revalidatePath(`/partidos/${matchId}`)
}

export async function toggleCardPrediction(formData: FormData): Promise<void> {
  const matchId = formData.get('match_id') as string
  const playerApiId = Number(formData.get('player_api_id'))
  const type = formData.get('type') as 'YELLOW_CARD' | 'RED_CARD'

  const status = await getMatchStatus(matchId)
  if (status !== 'UPCOMING') return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const serviceClient = createServiceClient()
  const { data: existing } = await serviceClient
    .from('prediction_players')
    .select('id')
    .eq('user_id', user.id)
    .eq('match_id', matchId)
    .eq('player_api_id', playerApiId)
    .eq('type', type)
    .maybeSingle()

  if (existing) {
    await serviceClient.from('prediction_players').delete().eq('id', existing.id)
  } else {
    const maxPicks = type === 'YELLOW_CARD' ? 2 : 1
    const { count } = await serviceClient
      .from('prediction_players')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('match_id', matchId)
      .eq('type', type)

    if ((count ?? 0) >= maxPicks) return

    await serviceClient.from('prediction_players').insert({
      user_id: user.id,
      match_id: matchId,
      player_api_id: playerApiId,
      type,
    })
  }

  revalidatePath(`/partidos/${matchId}`)
}

export async function toggleCleanSheetPrediction(formData: FormData): Promise<void> {
  const matchId = formData.get('match_id') as string
  revalidatePath(`/partidos/${matchId}`)
}
