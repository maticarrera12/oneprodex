import { notFound } from "next/navigation"

import MatchDetailScreen from "@/features/matches/components/match-detail-screen"
import { getMatchById, getMatchLineups, getMatchH2H, getMatchPredictions } from "@/features/matches/api"
import { getPredictionsForMatch, getPlayersForMatch, getMatchConsensusGroups } from "@/features/predictions/api"
import { createClient } from "@/lib/supabase/server"
import type { MatchEvent, MatchPredictionState } from "@/features/predictions/types"

type Props = { params: Promise<{ id: string }> }

const EMPTY_PREDICTION: MatchPredictionState = {
  score: null,
  scorerIds: [],
  yellowCardIds: [],
  redCardIds: [],
  cleanSheetCodes: [],
  editLocked: false,
}

export default async function MatchDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [match, predState] = await Promise.all([
    getMatchById(supabase, id, user?.id ?? null),
    user ? getPredictionsForMatch(supabase, id, user.id) : Promise.resolve(EMPTY_PREDICTION),
  ])

  if (!match) notFound()

  const [players, consensusGroups, lineups, h2h, matchPredictions] = await Promise.all([
    getPlayersForMatch(supabase, match.home, match.away),
    user ? getMatchConsensusGroups(supabase, match.id, user.id) : Promise.resolve([]),
    getMatchLineups(supabase, match.id, match.home, match.away),
    getMatchH2H(supabase, match.id),
    getMatchPredictions(supabase, match.id),
  ])

  // Build players map (api_id → photo_url) from the already-fetched players data
  const playersMap = new Map<number, string>()
  for (const player of [...players.home, ...players.away]) {
    if (player.photo_url) {
      playersMap.set(player.api_id, player.photo_url)
    }
  }

  const events: MatchEvent[] = []

  return (
    <MatchDetailScreen
      match={match}
      predictionState={predState}
      players={players}
      events={events}
      consensusGroups={consensusGroups}
      lineups={lineups}
      h2h={h2h}
      predictions={matchPredictions}
      playersMap={playersMap}
    />
  )
}
