import { getMatchesWithPredictions } from "@/features/matches/api"
import MatchSection from "@/features/matches/components/match-section"
import { EmptyState } from "@/features/shared/components/empty-state"
import { createClient } from "@/lib/supabase/server"

export default async function PartidosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const matches = user ? await getMatchesWithPredictions(supabase, user.id) : []

  const live = matches.filter((match) => match.status === "LIVE")
  const upcoming = matches.filter((match) => match.status === "UPCOMING")
  const finished = matches.filter((match) => match.status === "FINISHED")

  return (
    <div className="space-y-8 py-4">
      <h1 className="font-sans text-xl font-bold">Partidos</h1>
      {matches.length === 0 ? <EmptyState message="No hay partidos disponibles" /> : null}
      {live.length > 0 && <MatchSection title="En vivo" matches={live} />}
      {upcoming.length > 0 && <MatchSection title="Próximos" matches={upcoming} />}
      {finished.length > 0 && <MatchSection title="Finalizados" matches={finished} />}
    </div>
  )
}
