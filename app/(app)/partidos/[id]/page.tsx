import { notFound } from "next/navigation"

import MatchDetailScreen from "@/features/matches/components/match-detail-screen"
import { getMatchById } from "@/features/matches/api"
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

  const [players, consensusGroups] = await Promise.all([
    getPlayersForMatch(supabase, match.home, match.away),
    user ? getMatchConsensusGroups(supabase, match.id, user.id) : Promise.resolve([]),
  ])

  const events: MatchEvent[] = []

  return (
    <MatchDetailScreen
      match={match}
      predictionState={predState}
      players={players}
      events={events}
      consensusGroups={consensusGroups}
    />
  )
}
