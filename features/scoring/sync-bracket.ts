import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"
import {
  buildBracketPickPointsUpdates,
  isKnockoutStage,
  matchWinner,
  resolveBracketSlotForMatch,
} from "@/features/scoring/bracket"
import { applyWorldCupSeasonKickoffFilter } from "@/lib/world-cup/season"

type KnockoutMatch = {
  id: string
  home_team_code: string
  away_team_code: string
  home_score: number | null
  away_score: number | null
  status: string
  kickoff: string | null
  stage: string
}

export async function scoreBracketForMatch(
  supabase: SupabaseClient<Database>,
  match: KnockoutMatch,
): Promise<number> {
  if (!isKnockoutStage(match.stage)) return 0

  const winner = matchWinner(match)
  if (!winner) return 0

  const { data: stageMatches, error: stageError } = await applyWorldCupSeasonKickoffFilter(
    supabase.from("matches").select("id,home_team_code,away_team_code,home_score,away_score,status,kickoff,stage"),
  ).eq("stage", match.stage)

  if (stageError || !stageMatches) return 0

  const slot = resolveBracketSlotForMatch(match, stageMatches)
  if (!slot) return 0

  const { data: picks, error: picksError } = await supabase
    .from("bracket_picks")
    .select("user_id,team_code")
    .eq("slot", slot)

  if (picksError || !picks?.length) return 0

  const updates = buildBracketPickPointsUpdates(slot, winner, picks)
  await Promise.all(
    updates.map((row) =>
      supabase
        .from("bracket_picks")
        .update({ points: row.points })
        .eq("user_id", row.user_id)
        .eq("slot", row.slot),
    ),
  )

  return updates.filter((row) => row.points > 0).length
}

export async function scoreAllFinishedBracketMatches(
  supabase: SupabaseClient<Database>,
): Promise<{ scored: number; winners: number }> {
  const { data: matches, error } = await applyWorldCupSeasonKickoffFilter(
    supabase.from("matches").select("id,home_team_code,away_team_code,home_score,away_score,status,kickoff,stage"),
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
    scored++
  }

  return { scored, winners }
}
