import MatchSection from "@/features/matches/components/match-section"
import { MATCHES } from "@/features/matches/mock"

export default function PartidosPage() {
  const live = MATCHES.filter((m) => m.status === "LIVE")
  const upcoming = MATCHES.filter((m) => m.status === "UPCOMING")
  const finished = MATCHES.filter((m) => m.status === "FINISHED")

  return (
    <div className="space-y-8 py-4">
      <h1 className="font-sans text-xl font-bold">Partidos</h1>
      {live.length > 0 && <MatchSection title="En vivo" matches={live} />}
      {upcoming.length > 0 && <MatchSection title="Próximos" matches={upcoming} />}
      {finished.length > 0 && <MatchSection title="Finalizados" matches={finished} />}
    </div>
  )
}
