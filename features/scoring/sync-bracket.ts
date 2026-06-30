import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"
import {
  bracketPointsForSlot,
  getSlotParents,
  isKnockoutStage,
  matchWinner,
  resolveBracketSlotForMatch,
  scoreKnockoutResult,
  scoreMatchupHit,
} from "@/features/scoring/bracket"
import type { KnockoutMatch } from "@/features/scoring/bracket"
import type { SlotId } from "@/features/onboarding/types"
import { applyWorldCupSeasonKickoffFilter } from "@/lib/world-cup/season"

type SlotPick = { team_code: string; home_score: number | null; away_score: number | null }

/**
 * Combined per-slot scoring for a finished knockout match. Writes
 * bracket_picks.points = ADVANCEMENT + MATCHUP HIT + RESULT, each term computed
 * independently (a correct matchup pays even with a wrong winner pick).
 *
 * MATCHUP HIT and RESULT require the user's predicted pairing at the slot, which
 * is the SET of their two parent-slot winners — so they apply from R16 onward.
 * R32 (and THIRD) earn ADVANCEMENT only here; R32 RESULT needs the per-user
 * group-pick seeding and is a tracked follow-up.
 */
export async function scoreBracketForMatch(
  supabase: SupabaseClient<Database>,
  match: KnockoutMatch,
): Promise<number> {
  if (!isKnockoutStage(match.stage)) return 0

  const winner = matchWinner(match)
  if (!winner) return 0

  const { data: stageMatches, error: stageError } = await applyWorldCupSeasonKickoffFilter(
    supabase.from("matches").select("id,home_team_code,away_team_code,home_score,away_score,home_pen_score,away_pen_score,status,kickoff,stage"),
  ).eq("stage", match.stage)

  if (stageError || !stageMatches) return 0

  const slot = resolveBracketSlotForMatch(match, stageMatches)
  if (!slot) return 0

  const parents = getSlotParents(slot)
  const slotsToLoad: SlotId[] = parents ? [slot, parents[0], parents[1]] : [slot]

  const { data: pickRows, error: picksError } = await supabase
    .from("bracket_picks")
    .select("user_id,slot,team_code,home_score,away_score")
    .in("slot", slotsToLoad)

  if (picksError || !pickRows?.length) return 0

  // Group each user's relevant picks (this slot + its two parent slots).
  const byUser = new Map<string, Map<SlotId, SlotPick>>()
  for (const row of pickRows) {
    const slots = byUser.get(row.user_id) ?? new Map<SlotId, SlotPick>()
    slots.set(row.slot as SlotId, {
      team_code: row.team_code,
      home_score: row.home_score,
      away_score: row.away_score,
    })
    byUser.set(row.user_id, slots)
  }

  const realScores =
    match.home_score !== null && match.away_score !== null
      ? {
          homeTeam: match.home_team_code,
          awayTeam: match.away_team_code,
          homeScore: match.home_score,
          awayScore: match.away_score,
        }
      : null

  const updates: Array<{ user_id: string; points: number }> = []
  for (const [userId, slots] of byUser) {
    const own = slots.get(slot)
    if (!own) continue // user did not pick this slot

    let points = own.team_code === winner ? bracketPointsForSlot(slot) : 0

    if (parents) {
      const picksBySlot = new Map<SlotId, string>([...slots].map(([s, pick]) => [s, pick.team_code]))
      points += scoreMatchupHit(slot, match.home_team_code, match.away_team_code, picksBySlot)

      const homeTeam = slots.get(parents[0])?.team_code
      const awayTeam = slots.get(parents[1])?.team_code
      if (realScores && homeTeam && awayTeam) {
        points += scoreKnockoutResult(
          { homeTeam, awayTeam, homeScore: own.home_score, awayScore: own.away_score },
          realScores,
        )
      }
    }

    updates.push({ user_id: userId, points })
  }

  await Promise.all(
    updates.map((row) =>
      supabase
        .from("bracket_picks")
        .update({ points: row.points })
        .eq("user_id", row.user_id)
        .eq("slot", slot),
    ),
  )

  return updates.filter((row) => row.points > 0).length
}

export async function scoreAllFinishedBracketMatches(
  supabase: SupabaseClient<Database>,
): Promise<{ scored: number; winners: number }> {
  const { data: matches, error } = await applyWorldCupSeasonKickoffFilter(
    supabase.from("matches").select("id,home_team_code,away_team_code,home_score,away_score,home_pen_score,away_pen_score,status,kickoff,stage"),
  )
    .eq("status", "FINISHED")
    .in("stage", [
      "Round of 32",
      "Round of 16",
      "Quarter-finals",
      "Semi-finals",
      "3rd Place Final",
      "Final",
    ])

  if (error || !matches?.length) return { scored: 0, winners: 0 }

  let scored = 0
  let winners = 0
  for (const match of matches) {
    winners += await scoreBracketForMatch(supabase, match)
    await scoreKnockoutScorePicksForMatch(supabase, match)
    scored++
  }

  return { scored, winners }
}

/**
 * Scores the per-match scoreline predictions (knockout_score_picks) for a
 * finished knockout match against the real result. The bracket tree itself
 * advances by the real result regardless of these picks — they only earn
 * RESULT points (exact / correct outcome). The pick's teams are the real
 * fixture's teams, so orientation is direct.
 */
export async function scoreKnockoutScorePicksForMatch(
  supabase: SupabaseClient<Database>,
  match: KnockoutMatch,
): Promise<number> {
  if (!isKnockoutStage(match.stage)) return 0
  if (match.home_score === null || match.away_score === null) return 0

  const { data: picks, error } = await supabase
    .from("knockout_score_picks")
    .select("user_id,home_score,away_score")
    .eq("match_id", match.id)

  if (error || !picks?.length) return 0

  const real = {
    homeTeam: match.home_team_code,
    awayTeam: match.away_team_code,
    homeScore: match.home_score,
    awayScore: match.away_score,
  }

  const updates = picks.map((pick) => ({
    user_id: pick.user_id,
    points: scoreKnockoutResult(
      {
        homeTeam: match.home_team_code,
        awayTeam: match.away_team_code,
        homeScore: pick.home_score,
        awayScore: pick.away_score,
      },
      real,
    ),
  }))

  await Promise.all(
    updates.map((row) =>
      supabase
        .from("knockout_score_picks")
        .update({ points: row.points })
        .eq("user_id", row.user_id)
        .eq("match_id", match.id),
    ),
  )

  return updates.filter((row) => row.points > 0).length
}
