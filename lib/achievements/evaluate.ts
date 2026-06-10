import { createServiceClient } from '@/lib/supabase/service'

type SupabaseClient = ReturnType<typeof createServiceClient>

export type EvalResult = {
  achievement_id: string
  tier: 'bronze' | 'silver' | 'gold' | null
  progress_json: Record<string, unknown> | null
}

type AchievementRow = {
  id: string
  type: 'progressive' | 'one_shot'
  tiers: { bronze: number; silver: number; gold: number } | null
  points: { bronze?: number; silver?: number; gold?: number; value?: number }
}

export function computeMaxStreak(hits: boolean[]): number {
  let max = 0
  let current = 0
  for (const hit of hits) {
    if (hit) {
      current++
      if (current > max) max = current
    } else {
      current = 0
    }
  }
  return max
}

function tierForCount(
  count: number,
  thresholds: { bronze: number; silver: number; gold: number },
): 'bronze' | 'silver' | 'gold' | null {
  if (count >= thresholds.gold) return 'gold'
  if (count >= thresholds.silver) return 'silver'
  if (count >= thresholds.bronze) return 'bronze'
  return null
}

export async function evalMatador(
  userId: string,
  supabase: SupabaseClient,
  catalog: AchievementRow[],
): Promise<EvalResult | null> {
  const achievement = catalog.find((a) => a.id === 'matador')
  if (!achievement?.tiers) return null

  const { data, error } = await supabase
    .from('predictions')
    .select('id, home_score, away_score, match_id, points')
    .eq('user_id', userId)
    .not('points', 'is', null)

  if (error || !data) return null

  const matchIds = data.map((p) => p.match_id)
  if (matchIds.length === 0) {
    return { achievement_id: 'matador', tier: null, progress_json: { current: 0 } }
  }

  const { data: matches } = await supabase
    .from('matches')
    .select('id, home_score, away_score')
    .in('id', matchIds)
    .eq('status', 'FINISHED')

  if (!matches) {
    return { achievement_id: 'matador', tier: null, progress_json: { current: 0 } }
  }

  const matchMap = new Map(matches.map((m) => [m.id, m]))
  let correctCount = 0

  for (const pred of data) {
    const match = matchMap.get(pred.match_id)
    if (!match || match.home_score === null || match.away_score === null) continue

    const predictedWinner =
      pred.home_score > pred.away_score ? 'home' : pred.home_score < pred.away_score ? 'away' : 'draw'
    const actualWinner =
      match.home_score > match.away_score ? 'home' : match.home_score < match.away_score ? 'away' : 'draw'

    if (predictedWinner === actualWinner) correctCount++
  }

  return {
    achievement_id: 'matador',
    tier: tierForCount(correctCount, achievement.tiers),
    progress_json: { current: correctCount },
  }
}

export async function evalOnFire(
  userId: string,
  supabase: SupabaseClient,
  catalog: AchievementRow[],
): Promise<EvalResult | null> {
  const achievement = catalog.find((a) => a.id === 'on_fire')
  if (!achievement?.tiers) return null

  const { data: preds, error } = await supabase
    .from('predictions')
    .select('id, home_score, away_score, match_id, points')
    .eq('user_id', userId)
    .not('points', 'is', null)

  if (error || !preds || preds.length === 0) {
    return { achievement_id: 'on_fire', tier: null, progress_json: { current: 0 } }
  }

  const matchIds = preds.map((p) => p.match_id)
  const { data: matches } = await supabase
    .from('matches')
    .select('id, home_score, away_score, kickoff')
    .in('id', matchIds)
    .eq('status', 'FINISHED')
    .order('kickoff', { ascending: true })

  if (!matches || matches.length === 0) {
    return { achievement_id: 'on_fire', tier: null, progress_json: { current: 0 } }
  }

  const matchMap = new Map(matches.map((m) => [m.id, m]))
  const orderedPreds = preds
    .filter((p) => matchMap.has(p.match_id))
    .sort((a, b) => {
      const ka = matchMap.get(a.match_id)!.kickoff
      const kb = matchMap.get(b.match_id)!.kickoff
      return ka < kb ? -1 : ka > kb ? 1 : 0
    })

  const hits = orderedPreds.map((pred) => {
    const match = matchMap.get(pred.match_id)!
    if (match.home_score === null || match.away_score === null) return false
    const predictedWinner =
      pred.home_score > pred.away_score ? 'home' : pred.home_score < pred.away_score ? 'away' : 'draw'
    const actualWinner =
      match.home_score > match.away_score ? 'home' : match.home_score < match.away_score ? 'away' : 'draw'
    return predictedWinner === actualWinner
  })

  const maxStreak = computeMaxStreak(hits)

  return {
    achievement_id: 'on_fire',
    tier: tierForCount(maxStreak, achievement.tiers),
    progress_json: { current: maxStreak },
  }
}

export async function evalDeTaquito(
  userId: string,
  supabase: SupabaseClient,
  catalog: AchievementRow[],
): Promise<EvalResult | null> {
  const achievement = catalog.find((a) => a.id === 'de_taquito')
  if (!achievement?.tiers) return null

  const { data: preds, error } = await supabase
    .from('predictions')
    .select('id, home_score, away_score, match_id')
    .eq('user_id', userId)

  if (error || !preds || preds.length === 0) {
    return { achievement_id: 'de_taquito', tier: null, progress_json: { current: 0 } }
  }

  const matchIds = preds.map((p) => p.match_id)
  const { data: matches } = await supabase
    .from('matches')
    .select('id, home_score, away_score')
    .in('id', matchIds)
    .eq('status', 'FINISHED')

  if (!matches) {
    return { achievement_id: 'de_taquito', tier: null, progress_json: { current: 0 } }
  }

  const matchMap = new Map(matches.map((m) => [m.id, m]))
  let exactCount = 0

  for (const pred of preds) {
    const match = matchMap.get(pred.match_id)
    if (!match || match.home_score === null || match.away_score === null) continue
    if (pred.home_score === match.home_score && pred.away_score === match.away_score) exactCount++
  }

  return {
    achievement_id: 'de_taquito',
    tier: tierForCount(exactCount, achievement.tiers),
    progress_json: { current: exactCount },
  }
}

export async function evalAcumulador(
  userId: string,
  supabase: SupabaseClient,
  catalog: AchievementRow[],
): Promise<EvalResult | null> {
  const achievement = catalog.find((a) => a.id === 'acumulador')
  if (!achievement?.tiers) return null

  const { data, error } = await supabase
    .from('predictions')
    .select('points')
    .eq('user_id', userId)
    .not('points', 'is', null)

  if (error || !data) {
    return { achievement_id: 'acumulador', tier: null, progress_json: { current: 0 } }
  }

  const totalPts = data.reduce((sum, row) => sum + (row.points ?? 0), 0)

  return {
    achievement_id: 'acumulador',
    tier: tierForCount(totalPts, achievement.tiers),
    progress_json: { current: totalPts },
  }
}

export async function evalJuegaDavid(
  userId: string,
  supabase: SupabaseClient,
  catalog: AchievementRow[],
): Promise<EvalResult | null> {
  const achievement = catalog.find((a) => a.id === 'juega_david')
  if (!achievement?.tiers) return null

  const { data: preds, error: predError } = await supabase
    .from('predictions')
    .select('id, home_score, away_score, match_id')
    .eq('user_id', userId)

  if (predError || !preds || preds.length === 0) {
    return { achievement_id: 'juega_david', tier: null, progress_json: { current: 0 } }
  }

  const matchIds = preds.map((p) => p.match_id)

  const { data: matches, error: matchError } = await supabase
    .from('matches')
    .select('id, home_team_code, away_team_code, home_score, away_score, group_code, kickoff')
    .in('id', matchIds)
    .eq('status', 'FINISHED')
    .eq('stage', 'GROUP')

  if (matchError || !matches || matches.length === 0) {
    return { achievement_id: 'juega_david', tier: null, progress_json: { current: 0 } }
  }

  const matchMap = new Map(matches.map((m) => [m.id, m]))
  const predMap = new Map(preds.map((p) => [p.match_id, p]))
  let upsetCount = 0

  for (const match of matches) {
    if (!match.group_code) continue

    const pred = predMap.get(match.id)
    if (!pred) continue

    if (match.home_score === null || match.away_score === null) continue
    let actualWinner: string | null = null
    if (match.home_score > match.away_score) actualWinner = match.home_team_code
    else if (match.away_score > match.home_score) actualWinner = match.away_team_code
    else continue

    const groupMatches = await supabase
      .from('matches')
      .select('id, home_team_code, away_team_code, home_score, away_score, kickoff')
      .eq('group_code', match.group_code)
      .eq('status', 'FINISHED')
      .lt('kickoff', match.kickoff)

    if (!groupMatches.data) continue

    const dynamicStandings = new Map<string, { pts: number; gd: number; gf: number }>()

    for (const m of groupMatches.data) {
      if (m.home_score === null || m.away_score === null) continue

      if (!dynamicStandings.has(m.home_team_code)) {
        dynamicStandings.set(m.home_team_code, { pts: 0, gd: 0, gf: 0 })
      }
      if (!dynamicStandings.has(m.away_team_code)) {
        dynamicStandings.set(m.away_team_code, { pts: 0, gd: 0, gf: 0 })
      }

      const home = dynamicStandings.get(m.home_team_code)!
      const away = dynamicStandings.get(m.away_team_code)!

      home.gf += m.home_score
      home.gd += m.home_score - m.away_score
      away.gf += m.away_score
      away.gd += m.away_score - m.home_score

      if (m.home_score > m.away_score) { home.pts += 3 }
      else if (m.away_score > m.home_score) { away.pts += 3 }
      else { home.pts += 1; away.pts += 1 }
    }

    const sorted = [...dynamicStandings.entries()].sort(([, a], [, b]) => {
      if (b.pts !== a.pts) return b.pts - a.pts
      if (b.gd !== a.gd) return b.gd - a.gd
      return b.gf - a.gf
    })

    const actualWinnerIdx = sorted.findIndex(([code]) => code === actualWinner)
    if (actualWinnerIdx < 2) continue

    const predictedWinner =
      pred.home_score > pred.away_score
        ? match.home_team_code
        : pred.away_score > pred.home_score
          ? match.away_team_code
          : null

    if (predictedWinner === actualWinner) upsetCount++
  }

  return {
    achievement_id: 'juega_david',
    tier: tierForCount(upsetCount, achievement.tiers),
    progress_json: { current: upsetCount },
  }
}

export async function evalArrancamos(
  userId: string,
  supabase: SupabaseClient,
): Promise<EvalResult | null> {
  const { data, error } = await supabase
    .from('users')
    .select('bracket_submitted_at')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data || !data.bracket_submitted_at) return null

  return { achievement_id: 'arrancamos', tier: 'bronze', progress_json: null }
}

export async function evalLoPasoAlGrupo(
  userId: string,
  supabase: SupabaseClient,
): Promise<EvalResult | null> {
  const [userResult, membershipResult] = await Promise.all([
    supabase.from('users').select('bracket_submitted_at').eq('id', userId).maybeSingle(),
    supabase.from('group_members').select('group_id', { count: 'exact', head: true }).eq('user_id', userId),
  ])

  if (userResult.error || !userResult.data?.bracket_submitted_at) return null
  if (membershipResult.error || !membershipResult.count || membershipResult.count < 1) return null

  return { achievement_id: 'lo_paso_al_grupo', tier: 'bronze', progress_json: null }
}

export async function evalTrajoRefuerzos(
  userId: string,
  supabase: SupabaseClient,
): Promise<EvalResult | null> {
  const { count, error } = await supabase
    .from('group_members')
    .select('user_id', { count: 'exact', head: true })
    .eq('invited_by', userId)

  if (error || !count || count < 1) return null

  return { achievement_id: 'trajo_refuerzos', tier: 'bronze', progress_json: null }
}

export async function evalDeMemoria(
  userId: string,
  supabase: SupabaseClient,
): Promise<EvalResult | null> {
  const { data: userPicks, error: picksError } = await supabase
    .from('group_picks')
    .select('group_code, position, team_code')
    .eq('user_id', userId)
    .order('position', { ascending: true })

  if (picksError || !userPicks || userPicks.length === 0) return null

  const groupCodes = [...new Set(userPicks.map((p) => p.group_code))]

  const { data: groupMatches } = await supabase
    .from('matches')
    .select('home_team_code, away_team_code, home_score, away_score, group_code')
    .in('group_code', groupCodes)
    .eq('status', 'FINISHED')

  if (!groupMatches) return null

  const accum = new Map<string, { gc: string; pts: number; gd: number; gf: number }>()

  for (const m of groupMatches) {
    if (m.home_score === null || m.away_score === null || !m.group_code) continue

    if (!accum.has(m.home_team_code)) accum.set(m.home_team_code, { gc: m.group_code, pts: 0, gd: 0, gf: 0 })
    if (!accum.has(m.away_team_code)) accum.set(m.away_team_code, { gc: m.group_code, pts: 0, gd: 0, gf: 0 })

    const home = accum.get(m.home_team_code)!
    const away = accum.get(m.away_team_code)!

    home.gf += m.home_score
    home.gd += m.home_score - m.away_score
    away.gf += m.away_score
    away.gd += m.away_score - m.home_score

    if (m.home_score > m.away_score) { home.pts += 3 }
    else if (m.away_score > m.home_score) { away.pts += 3 }
    else { home.pts += 1; away.pts += 1 }
  }

  const groupRankings = new Map<string, string[]>()
  for (const gc of groupCodes) {
    const teams = [...accum.entries()]
      .filter(([, v]) => v.gc === gc)
      .sort(([, a], [, b]) => {
        if (b.pts !== a.pts) return b.pts - a.pts
        if (b.gd !== a.gd) return b.gd - a.gd
        return b.gf - a.gf
      })
      .map(([code]) => code)
    groupRankings.set(gc, teams)
  }

  for (const gc of groupCodes) {
    const groupPicks = userPicks
      .filter((p) => p.group_code === gc)
      .sort((a, b) => a.position - b.position)
      .slice(0, 4)
      .map((p) => p.team_code)

    const actualRanking = (groupRankings.get(gc) ?? []).slice(0, 4)

    if (groupPicks.length < 4 || actualRanking.length < 4) continue

    const exactMatch = groupPicks.every((code, idx) => code === actualRanking[idx])
    if (exactMatch) {
      return { achievement_id: 'de_memoria', tier: 'bronze', progress_json: null }
    }
  }

  return null
}

export async function evalLlegoALaSemi(
  userId: string,
  supabase: SupabaseClient,
): Promise<EvalResult | null> {
  const sfSlots = ['SF_P1', 'SF_P2', 'SF_P3', 'SF_P4']
  const { data: userPicks, error: picksError } = await supabase
    .from('bracket_picks')
    .select('slot, team_code')
    .eq('user_id', userId)
    .in('slot', sfSlots)

  if (picksError || !userPicks || userPicks.length < 4) return null

  const { data: sfMatches } = await supabase
    .from('matches')
    .select('home_team_code, away_team_code')
    .eq('stage', 'SEMI')
    .eq('status', 'FINISHED')

  if (!sfMatches || sfMatches.length < 2) return null

  const actualSemifinalists = new Set<string>()
  for (const m of sfMatches) {
    actualSemifinalists.add(m.home_team_code)
    actualSemifinalists.add(m.away_team_code)
  }

  if (actualSemifinalists.size < 4) return null

  const allCorrect = userPicks.every((pick) => actualSemifinalists.has(pick.team_code))
  if (!allCorrect) return null

  return { achievement_id: 'llego_a_la_semi', tier: 'bronze', progress_json: null }
}

export async function evalLoVeiaVenir(
  userId: string,
  supabase: SupabaseClient,
): Promise<EvalResult | null> {
  const { data: tournamentPred } = await supabase
    .from('tournament_predictions')
    .select('champion_code')
    .eq('user_id', userId)
    .maybeSingle()

  if (!tournamentPred?.champion_code) return null

  const { data: finalMatch } = await supabase
    .from('matches')
    .select('home_team_code, away_team_code, home_score, away_score')
    .eq('stage', 'FINAL')
    .eq('status', 'FINISHED')
    .maybeSingle()

  if (!finalMatch || finalMatch.home_score === null || finalMatch.away_score === null) return null

  let champion: string | null = null
  if (finalMatch.home_score > finalMatch.away_score) champion = finalMatch.home_team_code
  else if (finalMatch.away_score > finalMatch.home_score) champion = finalMatch.away_team_code

  if (!champion || tournamentPred.champion_code !== champion) return null

  return { achievement_id: 'lo_veia_venir', tier: 'bronze', progress_json: null }
}

export async function evalEsElNine(
  userId: string,
  supabase: SupabaseClient,
): Promise<EvalResult | null> {
  const { data: tournamentPred } = await supabase
    .from('tournament_predictions')
    .select('top_scorer_api_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (!tournamentPred?.top_scorer_api_id) return null

  const { data: events } = await supabase
    .from('match_events')
    .select('player_api_id')
    .in('type', ['GOAL', 'PENALTY'])
    .not('player_api_id', 'is', null)

  if (!events || events.length === 0) return null

  const scoreCounts = new Map<number, number>()
  for (const ev of events) {
    if (ev.player_api_id === null) continue
    scoreCounts.set(ev.player_api_id, (scoreCounts.get(ev.player_api_id) ?? 0) + 1)
  }

  if (scoreCounts.size === 0) return null

  const topScorer = [...scoreCounts.entries()].sort((a, b) => b[1] - a[1])[0]
  if (!topScorer) return null

  if (tournamentPred.top_scorer_api_id !== topScorer[0]) return null

  return { achievement_id: 'es_el_nine', tier: 'bronze', progress_json: null }
}

export async function evalEnElPodio(
  userId: string,
  supabase: SupabaseClient,
): Promise<EvalResult | null> {
  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId)

  if (!memberships || memberships.length === 0) return null

  const { count: finishedCount } = await supabase
    .from('matches')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'FINISHED')

  if (!finishedCount || finishedCount === 0) return null

  const { data: userPreds } = await supabase
    .from('predictions')
    .select('points')
    .eq('user_id', userId)
    .gt('points', 0)
    .limit(1)

  if (!userPreds || userPreds.length === 0) return null

  for (const membership of memberships) {
    const { data: leaderboard } = await supabase.rpc('get_group_leaderboard', {
      p_group_id: membership.group_id,
    })

    if (!leaderboard || leaderboard.length < 5) continue

    const userRankIdx = leaderboard.findIndex((row: { user_id: string }) => row.user_id === userId)
    if (userRankIdx === -1 || userRankIdx >= 3) continue

    return { achievement_id: 'en_el_podio', tier: 'bronze', progress_json: null }
  }

  return null
}

export async function evalFuaElDiego(
  userId: string,
  supabase: SupabaseClient,
): Promise<EvalResult | null> {
  const { count: totalMatches } = await supabase
    .from('matches')
    .select('id', { count: 'exact', head: true })

  const { count: finishedMatches } = await supabase
    .from('matches')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'FINISHED')

  if (!totalMatches || !finishedMatches || finishedMatches < totalMatches) return null

  const { data: preds } = await supabase
    .from('predictions')
    .select('id, home_score, away_score, match_id, points')
    .eq('user_id', userId)
    .not('points', 'is', null)

  if (!preds || preds.length === 0) return null

  const matchIds = preds.map((p) => p.match_id)
  const { data: matches } = await supabase
    .from('matches')
    .select('id, home_score, away_score')
    .in('id', matchIds)
    .eq('status', 'FINISHED')

  if (!matches || matches.length === 0) return null

  const matchMap = new Map(matches.map((m) => [m.id, m]))
  let correctCount = 0
  let totalCount = 0

  for (const pred of preds) {
    const match = matchMap.get(pred.match_id)
    if (!match || match.home_score === null || match.away_score === null) continue

    totalCount++
    const predictedWinner =
      pred.home_score > pred.away_score ? 'home' : pred.home_score < pred.away_score ? 'away' : 'draw'
    const actualWinner =
      match.home_score > match.away_score ? 'home' : match.home_score < match.away_score ? 'away' : 'draw'

    if (predictedWinner === actualWinner) correctCount++
  }

  if (totalCount === 0) return null

  const accuracy = correctCount / totalCount
  if (accuracy < 0.7) return null

  return { achievement_id: 'fua_el_diego', tier: 'bronze', progress_json: { accuracy } }
}

// ─── Core evaluation engine ───────────────────────────────────────────────────

async function evaluateUserWithCatalog(
  userId: string,
  supabase: SupabaseClient,
  catalog: AchievementRow[],
): Promise<void> {
  const settled = await Promise.allSettled([
    evalMatador(userId, supabase, catalog),
    evalOnFire(userId, supabase, catalog),
    evalDeTaquito(userId, supabase, catalog),
    evalAcumulador(userId, supabase, catalog),
    evalJuegaDavid(userId, supabase, catalog),
    evalArrancamos(userId, supabase),
    evalLoPasoAlGrupo(userId, supabase),
    evalTrajoRefuerzos(userId, supabase),
    evalDeMemoria(userId, supabase),
    evalLlegoALaSemi(userId, supabase),
    evalLoVeiaVenir(userId, supabase),
    evalEsElNine(userId, supabase),
    evalEnElPodio(userId, supabase),
    evalFuaElDiego(userId, supabase),
  ])

  const results: (EvalResult | null)[] = settled.map((s, i) => {
    if (s.status === 'rejected') {
      console.error(`[achievements] evaluator ${i} failed for user ${userId}:`, s.reason)
      return null
    }
    return s.value
  })

  const { data: existingRows, error: existingError } = await supabase
    .from('user_achievements')
    .select('achievement_id, tier')
    .eq('user_id', userId)

  if (existingError) {
    console.error(`[achievements] failed to fetch existing rows for user ${userId}:`, existingError)
    return
  }

  const existingMap = new Map(
    (existingRows ?? []).map((r) => [r.achievement_id, r.tier as string | null]),
  )

  const tierOrder: Record<string, number> = { bronze: 1, silver: 2, gold: 3 }
  let pointsDelta = 0

  for (const result of results) {
    if (!result) continue

    const existing = existingMap.get(result.achievement_id)
    const isProgressive =
      catalog.find((a) => a.id === result.achievement_id)?.type === 'progressive'

    if (isProgressive && result.tier === null) {
      const { error } = await supabase.from('user_achievements').upsert(
        {
          user_id: userId,
          achievement_id: result.achievement_id,
          tier: null,
          progress_json: result.progress_json,
        },
        { onConflict: 'user_id,achievement_id' },
      )
      if (error) console.error(`[achievements] upsert progress failed (${result.achievement_id}):`, error)
      continue
    }

    const existingOrder = existing !== undefined ? (tierOrder[existing ?? ''] ?? 0) : 0
    const newOrder = result.tier ? (tierOrder[result.tier] ?? 0) : 0
    const tierAdvanced = newOrder > existingOrder

    if (tierAdvanced && result.tier) {
      const achievementDef = catalog.find((a) => a.id === result.achievement_id)
      if (achievementDef) {
        const tierPts = isProgressive
          ? ((achievementDef.points as Record<string, number>)[result.tier] ?? 0)
          : ((achievementDef.points as { value?: number }).value ?? 0)
        pointsDelta += tierPts
      }
    }

    const { error } = await supabase.from('user_achievements').upsert(
      {
        user_id: userId,
        achievement_id: result.achievement_id,
        tier: result.tier,
        progress_json: result.progress_json,
        earned_at: tierAdvanced || existing === undefined ? new Date().toISOString() : undefined,
      },
      { onConflict: 'user_id,achievement_id' },
    )
    if (error) console.error(`[achievements] upsert failed (${result.achievement_id}):`, error)
  }

  if (pointsDelta > 0) {
    const { data: currentUser } = await supabase
      .from('users')
      .select('achievement_points')
      .eq('id', userId)
      .maybeSingle()

    if (currentUser) {
      const { error } = await supabase
        .from('users')
        .update({ achievement_points: (currentUser.achievement_points ?? 0) + pointsDelta })
        .eq('id', userId)
      if (error) console.error(`[achievements] points update failed for user ${userId}:`, error)
    }
  }
}

export async function evaluateUser(userId: string, supabase: SupabaseClient): Promise<void> {
  const { data: catalogData, error } = await supabase
    .from('achievements')
    .select('id, type, tiers, points')

  if (error || !catalogData) return

  await evaluateUserWithCatalog(userId, supabase, catalogData as AchievementRow[])
}

export async function evaluateAllUsers(supabase: SupabaseClient): Promise<void> {
  const [usersResult, catalogResult] = await Promise.all([
    supabase.from('users').select('id'),
    supabase.from('achievements').select('id, type, tiers, points'),
  ])

  if (usersResult.error || !usersResult.data) return
  if (catalogResult.error || !catalogResult.data) return

  const catalog = catalogResult.data as AchievementRow[]

  for (const user of usersResult.data) {
    await evaluateUserWithCatalog(user.id, supabase, catalog)
  }
}
