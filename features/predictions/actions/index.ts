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

  // Score lock guard: reject score update if prediction row already exists
  const { data: existing } = await serviceClient
    .from('predictions')
    .select('id')
    .eq('user_id', user.id)
    .eq('match_id', matchId)
    .maybeSingle()
  if (existing) return

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

  // 0-0 guard: reject scorer insert if stored prediction score is 0-0
  const { data: storedPrediction } = await serviceClient
    .from('predictions')
    .select('home_score,away_score')
    .eq('user_id', user.id)
    .eq('match_id', matchId)
    .maybeSingle()
  if (storedPrediction && storedPrediction.home_score === 0 && storedPrediction.away_score === 0) return

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

type ScorerOrCardRow = {
  player_api_id: number
  type: 'SCORER' | 'YELLOW_CARD' | 'RED_CARD'
}

export async function commitScorerEdits(formData: FormData): Promise<{ error?: string }> {
  const matchId = formData.get('match_id') as string
  const homeScoreRaw = formData.get('home_score')
  const awayScoreRaw = formData.get('away_score')
  const scorers: ScorerOrCardRow[] = JSON.parse(formData.get('scorers') as string ?? '[]')
  const cards: ScorerOrCardRow[] = JSON.parse(formData.get('cards') as string ?? '[]')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const serviceClient = createServiceClient()

  // Fetch stored prediction to check 0-0 and edit_locked state
  const { data: storedPrediction } = await serviceClient
    .from('predictions')
    .select('home_score,away_score,edit_locked')
    .eq('user_id', user.id)
    .eq('match_id', matchId)
    .maybeSingle()

  let prediction = storedPrediction
  if (!prediction) {
    if (homeScoreRaw === null || awayScoreRaw === null) return { error: 'no_prediction' }
    const homeScore = Number(homeScoreRaw)
    const awayScore = Number(awayScoreRaw)
    if (!Number.isFinite(homeScore) || !Number.isFinite(awayScore)) return { error: 'invalid_score' }

    const { error: scoreError } = await serviceClient.from('predictions').upsert(
      { user_id: user.id, match_id: matchId, home_score: homeScore, away_score: awayScore },
      { onConflict: 'user_id,match_id' },
    )
    if (scoreError) return { error: scoreError.message }

    prediction = { home_score: homeScore, away_score: awayScore, edit_locked: false }
  }

  const scoreIsZeroZero = prediction.home_score === 0 && prediction.away_score === 0

  // Atomic CAS: lock the prediction only if it's not already locked
  // UPDATE predictions SET edit_locked = true WHERE match_id = $1 AND user_id = $2 AND edit_locked = false RETURNING id
  const { data: locked } = await serviceClient
    .from('predictions')
    .update({ edit_locked: true })
    .eq('user_id', user.id)
    .eq('match_id', matchId)
    .eq('edit_locked', false)
    .select('id')

  if (!locked || locked.length === 0) {
    return { error: 'already_locked' }
  }

  // Delete existing scorer/card rows and insert new ones
  await serviceClient
    .from('prediction_players')
    .delete()
    .eq('user_id', user.id)
    .eq('match_id', matchId)

  let validScorers = scorers
  if (scoreIsZeroZero) {
    validScorers = []
  } else if (scorers.length > 0) {
    const { data: matchTeams } = await serviceClient
      .from('matches')
      .select('home_team_code,away_team_code')
      .eq('id', matchId)
      .maybeSingle()

    if (matchTeams) {
      const allowedTeamCodes = new Set<string>()
      if (prediction.home_score > 0) allowedTeamCodes.add(matchTeams.home_team_code)
      if (prediction.away_score > 0) allowedTeamCodes.add(matchTeams.away_team_code)

      const scorerIds = scorers.map((row) => row.player_api_id)
      const { data: playerRows } = await serviceClient
        .from('players')
        .select('api_id,team_code')
        .in('api_id', scorerIds)

      const teamByPlayerId = new Map((playerRows ?? []).map((row) => [row.api_id, row.team_code] as const))
      validScorers = scorers.filter((row) => {
        const teamCode = teamByPlayerId.get(row.player_api_id)
        return teamCode ? allowedTeamCodes.has(teamCode) : false
      })
    }
  }

  const rows = [...validScorers, ...cards]
  if (rows.length > 0) {
    await serviceClient.from('prediction_players').insert(
      rows.map((row) => ({
        user_id: user.id,
        match_id: matchId,
        player_api_id: row.player_api_id,
        type: row.type,
      }))
    )
  }

  revalidatePath(`/partidos/${matchId}`)
  return {}
}
