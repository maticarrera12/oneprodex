import Link from "next/link"

import { UpcomingRow } from "@/features/home/components/upcoming-row"
import type { Match, Team } from "@/features/matches/types"

type UpcomingSectionProps = {
  matches: Match[]
  teams: Record<string, Team>
}

export function UpcomingSection({ matches, teams }: UpcomingSectionProps) {
  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-[0.04em] border-l-4 border-primary pl-2 text-foreground/85">Proximas Predicciones</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{matches.length} partidos</span>
          <Link href="/partidos" className="text-xs font-semibold text-(--color-primary)">
            Ver todo
          </Link>
        </div>
      </header>

      <div className="space-y-2">
        {matches.map((match) => (
          <UpcomingRow key={match.id} match={match} teams={teams} />
        ))}
      </div>
    </section>
  )
}
