import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"

export const WORLD_CUP_LEAGUE_ID = 1

export function getWorldCupSeason(): number {
  const raw = process.env.FOOTBALL_SEASON?.trim()
  if (!raw) return 2026
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : 2026
}

export function getWorldCupKickoffRange(season = getWorldCupSeason()) {
  return {
    from: `${season}-01-01T00:00:00.000Z`,
    to: `${season + 1}-01-01T00:00:00.000Z`,
  } as const
}

type KickoffFilterQuery = {
  gte(column: "kickoff", value: string): KickoffFilterQuery
  lt(column: "kickoff", value: string): KickoffFilterQuery
}

export function applyWorldCupSeasonKickoffFilter<T extends KickoffFilterQuery>(
  query: T,
  season = getWorldCupSeason(),
): T {
  const { from, to } = getWorldCupKickoffRange(season)
  return query.gte("kickoff", from).lt("kickoff", to) as T
}

export async function pruneOutOfSeasonMatches(
  supabase: SupabaseClient<Database>,
  season = getWorldCupSeason(),
): Promise<{ deleted: number; error: string | null }> {
  const { from, to } = getWorldCupKickoffRange(season)

  const { data: staleMatches, error: lookupError } = await supabase
    .from("matches")
    .select("id")
    .or(`kickoff.lt.${from},kickoff.gte.${to}`)

  if (lookupError) {
    return { deleted: 0, error: lookupError.message }
  }

  const staleIds = (staleMatches ?? []).map((row) => row.id)
  if (staleIds.length === 0) {
    return { deleted: 0, error: null }
  }

  const { error: eventsError } = await supabase.from("match_events").delete().in("match_id", staleIds)
  if (eventsError) {
    return { deleted: 0, error: eventsError.message }
  }

  const { error: predictionsError } = await supabase.from("predictions").delete().in("match_id", staleIds)
  if (predictionsError) {
    return { deleted: 0, error: predictionsError.message }
  }

  const { data: deletedRows, error: deleteError } = await supabase
    .from("matches")
    .delete()
    .in("id", staleIds)
    .select("id")

  if (deleteError) {
    return { deleted: 0, error: deleteError.message }
  }

  return { deleted: deletedRows?.length ?? 0, error: null }
}
