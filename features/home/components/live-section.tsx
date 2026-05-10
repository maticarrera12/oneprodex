import { LiveCard } from "@/features/home/components/live-card"
import { LiveDot } from "@/features/home/components/live-dot"
import type { Match, Team } from "@/features/matches/types"

type LiveSectionProps = {
  liveMatches: Match[]
  teams: Record<string, Team>
}

export function LiveSection({ liveMatches, teams }: LiveSectionProps) {
  return (
    <section className="-mx-4 my-5">
      <header className="mb-2 flex items-center justify-between px-5">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold tracking-[0.04em] text-foreground/85 uppercase">
          <LiveDot />
          Live now
        </h2>
        <span className="font-mono text-xs text-muted-foreground">{liveMatches.length} matches</span>
      </header>

      <div className="scrollbar-none flex snap-x snap-mandatory gap-3 px-5 pb-1.5">
        {liveMatches.map((match) => (
          <LiveCard key={match.id} match={match} teams={teams} />
        ))}
      </div>
    </section>
  )
}
