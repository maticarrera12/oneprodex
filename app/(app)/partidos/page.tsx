import { getMatchesWithPredictions } from "@/features/matches/api"
import { MatchesByDayList } from "@/features/matches/components/matches-by-day-list"
import { TEAMS } from "@/features/matches/mock"
import { EmptyState } from "@/features/shared/components/empty-state"
import { createClient } from "@/lib/supabase/server"

export default async function PartidosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const matches = user ? await getMatchesWithPredictions(supabase, user.id) : []

  return (
    <div className="space-y-6 py-4">
      <h1 className="font-sans text-xl font-bold">Partidos</h1>
      {matches.length === 0 ? (
        <EmptyState message="No hay partidos disponibles" />
      ) : (
        <MatchesByDayList matches={matches} teams={TEAMS} />
      )}
    </div>
  )
}
