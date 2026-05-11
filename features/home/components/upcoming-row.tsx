import Link from "next/link"

import { Flag } from "@/features/home/components/flag"
import type { Match, Team } from "@/features/matches/types"

type UpcomingRowProps = {
  match: Match
  teams: Record<string, Team>
}

function formatKickoff(kickoff: string): { date: string; time: string } {
  const parsed = new Date(kickoff)
  if (Number.isNaN(parsed.getTime())) {
    const fallback = kickoff.split(" · ")
    return { date: fallback[0] ?? kickoff, time: fallback[1] ?? "" }
  }

  const date = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
  }).format(parsed)

  const time = new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parsed)

  return { date, time }
}

export function UpcomingRow({ match, teams }: UpcomingRowProps) {
  const home = teams[match.home]
  const away = teams[match.away]
  const kickoff = formatKickoff(match.kickoff)
  const hasPrediction = Boolean(match.pred)

  return (
    <Link href={`/partidos/${match.id}`} className="block">
      <article className="flex items-center justify-between gap-3 rounded-xl border border-border/80 border-l-primary border-l-2 bg-card/90 px-3.5 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {match.homeLogo ? (
            <img
              src={match.homeLogo}
              alt={home?.name ?? match.home}
              className="size-7 rounded-full border border-white/20 object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.2)]"
            />
          ) : (
            <Flag code={match.home} />
          )}
          <span className="text-sm font-semibold">{home?.code ?? match.home}</span>
          <span className="px-1 font-mono text-[11px] text-muted-foreground">vs</span>
          {match.awayLogo ? (
            <img
              src={match.awayLogo}
              alt={away?.name ?? match.away}
              className="size-7 rounded-full border border-white/20 object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.2)]"
            />
          ) : (
            <Flag code={match.away} />
          )}
          <span className="text-sm font-semibold">{away?.code ?? match.away}</span>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-muted-foreground">
              {kickoff.date}
            </p>
            <p className="mt-0.5 font-mono text-sm font-semibold">{kickoff.time}</p>
          </div>
          {hasPrediction ? (
            <span className="inline-flex min-w-[74px] justify-center rounded-[10px] border border-primary/35 bg-primary/10 px-2.5 py-1 font-mono text-[13px] font-semibold text-primary">
              {match.pred?.hs}–{match.pred?.as}
            </span>
          ) : (
            <span className="inline-flex min-w-[74px] justify-center rounded-[10px] border border-border/80 bg-white/5 px-2.5 py-1 text-xs text-foreground/80">
              Predict
            </span>
          )}
        </div>
      </article>
    </Link>
  )
}
