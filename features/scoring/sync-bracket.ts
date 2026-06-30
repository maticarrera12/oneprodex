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
import type { GroupCode, GroupRankings, SlotId } from "@/features/onboarding/types"
import { resolveR32Pairs } from "@/features/onboarding/utils/slot-resolver"
import { applyWorldCupSeasonKickoffFilter } from "@/lib/world-cup/season"

const GROUP_CODES: GroupCode[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]

/**
 * Resolves each user's predicted R32 pairings (in slot order R32_P1..P16) from
 * their group picks + best thirds. Needed for R32 RESULT scoring: the predicted
 * R32 matchup comes from group standings, not from bracket picks.
 */
async function loadR32PredictedPairsByUser(
  supabase: SupabaseClient<Database>,
  userIds: string[],
): Promise<Map<string, Array<{ home: string; away: string }>>> {
  const result = new Map<string, Array<{ home: string; away: string }>>()
  if (userIds.length === 0) return result

  const { data, error } = await supabase
    .from("group_picks")
    .select("user_id,group_code,position,team_code,advances_as_third")
    .in("user_id", userIds)

  if (error || !data) return result

  const rowsByUser = new Map<string, typeof data>()
  for (const row of data) {
    const list = rowsByUser.get(row.user_id) ?? []
    list.push(row)
    rowsByUser.set(row.user_id, list)
  }

  for (const [userId, rows] of rowsByUser) {
    const rankings = {} as GroupRankings
    for (const g of GROUP_CODES) rankings[g] = ["", "", "", ""]
    for (const row of rows) {
      const g = row.group_code as GroupCode
      if (rankings[g] && row.position >= 1 && row.position <= 4) rankings[g][row.position - 1] = row.team_code
    }
    const bestThirds = rows
      .filter((r) => r.position === 3 && r.advances_as_third)
      .sort((a, b) => a.group_code.localeCompare(b.group_code))
      .map((r) => r.team_code)

    result.set(userId, resolveR32Pairs(rankings, bestThirds))
  }

  return result
}

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

  // R32 has no parent bracket picks — its predicted pairing comes from each
  // user's group-pick seeding, which we need to align the scoreline for RESULT.
  const isR32 = slot.startsWith("R32_")
  const r32PairsByUser =
    isR32 && realScores ? await loadR32PredictedPairsByUser(supabase, [...byUser.keys()]) : null
  const r32Index = isR32 ? Number(slot.slice("R32_P".length)) - 1 : -1

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
    } else if (realScores && r32PairsByUser) {
      // R32 RESULT — no MATCHUP HIT (matchups come from group picks, not bracket picks).
      const pair = r32PairsByUser.get(userId)?.[r32Index]
      if (pair) {
        points += scoreKnockoutResult(
          { homeTeam: pair.home, awayTeam: pair.away, homeScore: own.home_score, awayScore: own.away_score },
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
