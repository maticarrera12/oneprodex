import Link from "next/link"

import { Flag } from "@/features/home/components/flag"
import { LiveBadge } from "@/features/home/components/live-badge"
import type { Match, Team } from "@/features/matches/types"

type LiveCardProps = {
  match: Match
  teams: Record<string, Team>
}

export function LiveCard({ match, teams }: LiveCardProps) {
  const home = teams[match.home]
  const away = teams[match.away]
  const onTrack = Boolean(match.pred && match.pred.hs === match.hs && match.pred.as === match.as)
  const stage = match.stage.split(" · ")[0]

  return (
    <Link href={`/partidos/${match.id}`} className="block">
      <article
        className="relative w-[280px] shrink-0 snap-start overflow-hidden rounded-2xl border border-l-primary border-l-2 border-border/80 p-4"
        style={{ background: "linear-gradient(180deg, var(--color-card-hi) 0%, var(--color-card) 100%)" }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 size-28 rounded-full bg-primary/18 blur-3xl"
        />

        <div className="relative flex items-center justify-between">
          <LiveBadge minute={match.minute} />
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{stage}</p>
        </div>

        <div className="relative mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag code={match.home} />
            <span className="text-[15px] font-semibold">{home?.code ?? match.home}</span>
          </div>
          <p className="font-mono text-[28px] leading-none font-semibold tracking-[-0.02em]">
            {match.hs ?? "-"}
            <span className="px-1.5 text-muted-foreground">·</span>
            {match.as ?? "-"}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-semibold">{away?.code ?? match.away}</span>
            <Flag code={match.away} />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-lg border border-border/80 bg-white/5 px-2.5 py-2">
          <div>
            <p className="text-xs text-muted-foreground">Your pick</p>
            <p className="justify-center font-mono text-sm font-semibold text-foreground">
              {match.pred ? `${match.pred.hs}-${match.pred.as}` : "No pick"}
            </p>
          </div>
          <p className={`text-xs font-semibold ${onTrack ? "text-primary" : "text-amber-400"}`}>
            {onTrack ? "ON TRACK" : "EN RIESGO"}
          </p>
        </div>
      </article>
    </Link>
  )
}
