import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

// ─── Auth guard ──────────────────────────────────────────────────────────────

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

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Pure helpers ────────────────────────────────────────────────────────────

/** Compute the maximum consecutive streak of truthy values in a boolean array. */
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

// ─── Progressive evaluators ──────────────────────────────────────────────────

export async function evalMatador(
  userId: string,
  supabase: SupabaseClient,
  catalog: AchievementRow[],
): Promise<EvalResult | null> {
  const achievement = catalog.find((a) => a.id === 'matador')
  if (!achievement?.tiers) return null

  // A "correct result" = user's predicted winner matches actual winner (points > 0 counts)
  // We use the predictions table; points > 0 means the result was correct
  const { data, error } = await supabase
    .from('predictions')
    .select('id, home_score, away_score, match_id, points')
    .eq('user_id', userId)
    .not('points', 'is', null)

  if (error || !data) return null

  // Fetch finished matches to determine winner from scores
  const matchIds = data.map((p) => p.match_id)
  if (matchIds.length === 0) {
    return {
      achievement_id: 'matador',
      tier: null,
      progress_json: { current: 0 },
    }
  }

  const { data: matches } = await supabase
    .from('matches')
    .select('id, home_score, away_score')
    .in('id', matchIds)
    .eq('status', 'FINISHED')

  if (!matches) {
    return {
      achievement_id: 'matador',
      tier: null,
      progress_json: { current: 0 },
    }
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

    if (predictedWinner === actualWinner) {
      correctCount++
    }
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

  // Ordered by kickoff ascending
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
    if (pred.home_score === match.home_score && pred.away_score === match.away_score) {
      exactCount++
    }
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

// ─── juega_david ─────────────────────────────────────────────────────────────

export async function evalJuegaDavid(
  userId: string,
  supabase: SupabaseClient,
  catalog: AchievementRow[],
): Promise<EvalResult | null> {
  const achievement = catalog.find((a) => a.id === 'juega_david')
  if (!achievement?.tiers) return null

  // Get user's predictions for group stage FINISHED matches
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

    // Determine actual winner
    if (match.home_score === null || match.away_score === null) continue
    let actualWinner: string | null = null
    if (match.home_score > match.away_score) actualWinner = match.home_team_code
    else if (match.away_score > match.home_score) actualWinner = match.away_team_code
    else continue // draw — no upset possible

    // Compute group standings using only FINISHED matches with kickoff BEFORE this match's kickoff
    const groupMatches = await supabase
      .from('matches')
      .select('id, home_team_code, away_team_code, home_score, away_score, kickoff')
      .eq('group_code', match.group_code)
      .eq('status', 'FINISHED')
      .lt('kickoff', match.kickoff)

    if (!groupMatches.data) continue

    // Build dynamic standings from those prior matches
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

      if (m.home_score > m.away_score) {
        home.pts += 3
      } else if (m.away_score > m.home_score) {
        away.pts += 3
      } else {
        home.pts += 1
        away.pts += 1
      }
    }

    // Sort teams by pts DESC, gd DESC, gf DESC
    const sorted = [...dynamicStandings.entries()].sort(([, a], [, b]) => {
      if (b.pts !== a.pts) return b.pts - a.pts
      if (b.gd !== a.gd) return b.gd - a.gd
      return b.gf - a.gf
    })

    // Position 0 or 1 (0-indexed) = favorites; position 2+ = underdogs
    const actualWinnerIdx = sorted.findIndex(([code]) => code === actualWinner)
    if (actualWinnerIdx < 2) continue // favorite won, skip

    // Was the upset winner predicted?
    const predictedWinner =
      pred.home_score > pred.away_score
        ? match.home_team_code
        : pred.away_score > pred.home_score
          ? match.away_team_code
          : null

    if (predictedWinner === actualWinner) {
      upsetCount++
    }
  }

  return {
    achievement_id: 'juega_david',
    tier: tierForCount(upsetCount, achievement.tiers),
    progress_json: { current: upsetCount },
  }
}

// ─── One-shot evaluators ─────────────────────────────────────────────────────

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

  return { achievement_id: 'arrancamos', tier: null, progress_json: null }
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

  return { achievement_id: 'trajo_refuerzos', tier: null, progress_json: null }
}

export async function evalDeMemoria(
  userId: string,
  supabase: SupabaseClient,
): Promise<EvalResult | null> {
  // Get user's group_picks
  const { data: userPicks, error: picksError } = await supabase
    .from('group_picks')
    .select('group_code, position, team_code')
    .eq('user_id', userId)
    .order('position', { ascending: true })

  if (picksError || !userPicks || userPicks.length === 0) return null

  const groupCodes = [...new Set(userPicks.map((p) => p.group_code))]

  // Compute actual group rankings on-the-fly from FINISHED group matches
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

  // Check if user's picks for positions 0-3 (position field is 0-indexed or 1-indexed?)
  // The table stores position; we compare by position 1-4 (or 0-3)
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
      return { achievement_id: 'de_memoria', tier: null, progress_json: null }
    }
  }

  return null
}

export async function evalLlegoALaSemi(
  userId: string,
  supabase: SupabaseClient,
): Promise<EvalResult | null> {
  // Get user's bracket_picks for SF slots
  const sfSlots = ['SF_P1', 'SF_P2', 'SF_P3', 'SF_P4']
  const { data: userPicks, error: picksError } = await supabase
    .from('bracket_picks')
    .select('slot, team_code')
    .eq('user_id', userId)
    .in('slot', sfSlots)

  if (picksError || !userPicks || userPicks.length < 4) return null

  // Get actual semifinalist matches (stage = 'SEMI' or similar, status = FINISHED)
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

  return { achievement_id: 'llego_a_la_semi', tier: null, progress_json: null }
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

  // Find the Final winner
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

  return { achievement_id: 'lo_veia_venir', tier: null, progress_json: null }
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

  // Find actual top scorer: player with most GOALs in match_events across all FINISHED matches
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

  return { achievement_id: 'es_el_nine', tier: null, progress_json: null }
}

export async function evalEnElPodio(
  userId: string,
  supabase: SupabaseClient,
): Promise<EvalResult | null> {
  // Get user's groups
  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId)

  if (!memberships || memberships.length === 0) return null

  // Check if at least 1 FINISHED match exists in the tournament
  const { count: finishedCount } = await supabase
    .from('matches')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'FINISHED')

  if (!finishedCount || finishedCount === 0) return null

  // Check user's prediction points > 0 (at least 1 scored prediction)
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

    // User is in top 3, group has 5+ members
    return { achievement_id: 'en_el_podio', tier: null, progress_json: null }
  }

  return null
}

export async function evalFuaElDiego(
  userId: string,
  supabase: SupabaseClient,
): Promise<EvalResult | null> {
  // Guard: ALL matches (including knockout) must be FINISHED
  const { count: totalMatches } = await supabase
    .from('matches')
    .select('id', { count: 'exact', head: true })

  const { count: finishedMatches } = await supabase
    .from('matches')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'FINISHED')

  if (!totalMatches || !finishedMatches || finishedMatches < totalMatches) return null

  // Compute accuracy: correct_results / total_predictions with non-null points
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

  return { achievement_id: 'fua_el_diego', tier: null, progress_json: { accuracy } }
}

// ─── Upsert loop + achievement_points increment ───────────────────────────────

async function runEvaluations(supabase: SupabaseClient): Promise<void> {
  // Fetch all users
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id')

  if (usersError || !users) return

  // Fetch achievements catalog once
  const { data: catalogData, error: catalogError } = await supabase
    .from('achievements')
    .select('id, type, tiers, points')

  if (catalogError || !catalogData) return

  const catalog = catalogData as AchievementRow[]

  for (const user of users) {
    const userId = user.id

    // Run all evaluators
    const results = await Promise.all([
      evalMatador(userId, supabase, catalog),
      evalOnFire(userId, supabase, catalog),
      evalDeTaquito(userId, supabase, catalog),
      evalAcumulador(userId, supabase, catalog),
      evalJuegaDavid(userId, supabase, catalog),
      evalArrancamos(userId, supabase),
      evalTrajoRefuerzos(userId, supabase),
      evalDeMemoria(userId, supabase),
      evalLlegoALaSemi(userId, supabase),
      evalLoVeiaVenir(userId, supabase),
      evalEsElNine(userId, supabase),
      evalEnElPodio(userId, supabase),
      evalFuaElDiego(userId, supabase),
    ])

    // Get existing user_achievements for this user
    const { data: existingRows } = await supabase
      .from('user_achievements')
      .select('achievement_id, tier')
      .eq('user_id', userId)

    const existingMap = new Map(
      (existingRows ?? []).map((r) => [r.achievement_id, r.tier as string | null]),
    )

    let pointsDelta = 0

    for (const result of results) {
      if (!result) continue

      // For progressive achievements, track tier advancement
      const existing = existingMap.get(result.achievement_id)
      const isProgressive =
        catalog.find((a) => a.id === result.achievement_id)?.type === 'progressive'

      if (isProgressive && result.tier === null) {
        // No tier yet — only upsert to track progress, no points
        await supabase.from('user_achievements').upsert(
          {
            user_id: userId,
            achievement_id: result.achievement_id,
            tier: null,
            progress_json: result.progress_json,
          },
          { onConflict: 'user_id,achievement_id' },
        )
        continue
      }

      // Determine if tier advanced
      const tierOrder: Record<string, number> = { bronze: 1, silver: 2, gold: 3 }
      const existingOrder = existing ? (tierOrder[existing] ?? 0) : 0
      const newOrder = result.tier ? (tierOrder[result.tier] ?? 0) : 0
      const tierAdvanced = newOrder > existingOrder

      if (tierAdvanced && result.tier) {
        // Compute points delta from catalog
        const achievementDef = catalog.find((a) => a.id === result.achievement_id)
        if (achievementDef) {
          const tierPts = isProgressive
            ? ((achievementDef.points as Record<string, number>)[result.tier] ?? 0)
            : ((achievementDef.points as { value?: number }).value ?? 0)
          pointsDelta += tierPts
        }
      }

      // Upsert with conditional earned_at
      await supabase.from('user_achievements').upsert(
        {
          user_id: userId,
          achievement_id: result.achievement_id,
          tier: result.tier,
          progress_json: result.progress_json,
          earned_at: tierAdvanced || !existing ? new Date().toISOString() : undefined,
        },
        { onConflict: 'user_id,achievement_id' },
      )
    }

    // Increment achievement_points if any tier advanced
    // Use select + update pattern since Supabase JS doesn't support atomic += natively
    if (pointsDelta > 0) {
      const { data: currentUser } = await supabase
        .from('users')
        .select('achievement_points')
        .eq('id', userId)
        .maybeSingle()

      if (currentUser) {
        await supabase
          .from('users')
          .update({ achievement_points: (currentUser.achievement_points ?? 0) + pointsDelta })
          .eq('id', userId)
      }
    }
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const unauthorized = guardAuth(request)
  if (unauthorized) return unauthorized

  try {
    const supabase = createServiceClient()
    await runEvaluations(supabase)
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
