import Link from "next/link"

import { Flag } from "@/features/home/components/flag"
import { LiveBadge } from "@/features/home/components/live-badge"
import { isLivePredictionExact, isLivePredictionOnTrack } from "@/features/matches/utils/live-prediction"
import type { Match, Team } from "@/features/matches/types"

type LiveCardProps = {
  match: Match
  teams: Record<string, Team>
}

export function LiveCard({ match, teams }: LiveCardProps) {
  const home = teams[match.home]
  const away = teams[match.away]
  const onTrack = isLivePredictionOnTrack(match.pred, { hs: match.hs, as: match.as })
  const exact = isLivePredictionExact(match.pred, { hs: match.hs, as: match.as })
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
            {match.homeLogo ? (
              <img
                src={match.homeLogo}
                alt={home?.name ?? match.home}
                className="size-7 rounded-full border border-white/20 object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.2)]"
              />
            ) : (
              <Flag code={match.home} />
            )}
            <span className="text-[15px] font-semibold">{home?.code ?? match.home}</span>
          </div>
          <p className="font-mono text-[28px] leading-none font-semibold tracking-[-0.02em]">
            {match.hs ?? "-"}
            <span className="px-1.5 text-muted-foreground">·</span>
            {match.as ?? "-"}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-semibold">{away?.code ?? match.away}</span>
            {match.awayLogo ? (
              <img
                src={match.awayLogo}
                alt={away?.name ?? match.away}
                className="size-7 rounded-full border border-white/20 object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.2)]"
              />
            ) : (
              <Flag code={match.away} />
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-lg border border-border/80 bg-white/5 px-2.5 py-2">
          <div>
            <p className="text-xs text-muted-foreground">Your pick</p>
            <p className="justify-center font-mono text-sm font-semibold text-foreground">
              {match.pred ? `${match.pred.hs}-${match.pred.as}` : "No pick"}
            </p>
          </div>
          {match.pred ? (
            <p className={`text-xs font-semibold ${onTrack ? "text-primary" : "text-amber-400"}`}>
              {exact ? "EXACTO" : onTrack ? "ON TRACK" : "EN RIESGO"}
            </p>
          ) : null}
        </div>
      </article>
    </Link>
  )
}
