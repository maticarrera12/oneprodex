import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar02Icon } from "@hugeicons/core-free-icons"

import { Flag } from "@/features/home/components/flag"
import { calcPoints } from "@/features/matches/utils/points"
import { formatKickoffParts } from "@/features/matches/utils/kickoff"
import type { Match, Team } from "@/features/matches/types"

type MatchScheduleRowProps = {
  match: Match
  teams: Record<string, Team>
}

function TeamBadge({
  code,
  name,
  logo,
}: {
  code: string
  name?: string
  logo?: string | null
}) {
  if (logo) {
    return (
      <img
        src={logo}
        alt={name ?? code}
        className="size-7 rounded-full border border-white/20 object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.2)]"
      />
    )
  }

  return <Flag code={code} />
}

export function MatchScheduleRow({ match, teams }: MatchScheduleRowProps) {
  const home = teams[match.home]
  const away = teams[match.away]
  const kickoff = formatKickoffParts(match.kickoff)
  const hasPrediction = Boolean(match.pred)
  const points = match.status === "FINISHED" ? calcPoints(match) : null
  const isLive = match.status === "LIVE"

  return (
    <Link href={`/partidos/${match.id}`} className="block">
      <article
        className={`grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl border bg-card/90 px-3.5 py-3 ${
          isLive ? "border-l-2 border-l-(--color-lime-deep) border-border/80" : "border-border/80 border-l-primary border-l-2"
        }`}
      >
        <div className="flex min-w-0 items-center gap-2">
          <TeamBadge code={match.home} name={home?.name} logo={match.homeLogo} />
          <span className="text-sm font-semibold">{home?.code ?? match.home}</span>
          {isLive || match.status === "FINISHED" ? (
            <span className="px-1 font-mono text-sm font-semibold text-foreground">
              {match.hs ?? "-"}–{match.as ?? "-"}
            </span>
          ) : (
            <span className="px-1 font-mono text-[11px] text-muted-foreground">vs</span>
          )}
          <TeamBadge code={match.away} name={away?.name} logo={match.awayLogo} />
          <span className="text-sm font-semibold">{away?.code ?? match.away}</span>
        </div>

        <div className="justify-self-center rounded-md border border-zinc-800 p-1">
          {isLive ? (
            <div className="flex min-w-[88px] flex-col items-center px-1 py-0.5">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-(--color-primary)">
                En vivo
              </span>
              <p className="mt-0.5 font-mono text-sm font-semibold">{match.minute ?? 0}&apos;</p>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <HugeiconsIcon icon={Calendar02Icon} size={32} color="currentColor" strokeWidth={1.5} />
              <div className="flex flex-col items-center">
                <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-zinc-400">
                  {kickoff.date}
                </p>
                <p className="mt-0.5 font-mono text-sm font-semibold">{kickoff.time}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          {match.status === "FINISHED" && hasPrediction ? (
            <div className="flex flex-col items-center gap-1">
              <span
                className={`inline-flex min-w-[74px] justify-center rounded-[10px] border px-2.5 py-1 font-mono text-[13px] font-semibold ${
                  points?.exact
                    ? "border-primary/35 bg-primary/10 text-primary"
                    : points?.winner
                      ? "border-(--color-amber)/35 bg-(--color-amber)/10 text-(--color-amber)"
                      : "border-border/80 bg-white/5 text-muted-foreground"
                }`}
              >
                {match.pred?.hs}–{match.pred?.as}
              </span>
              <p className="text-xs text-muted-foreground">{points?.pts ?? 0} pts</p>
            </div>
          ) : hasPrediction ? (
            <div className="flex flex-col items-center gap-1">
              <span className="inline-flex min-w-[74px] justify-center rounded-[10px] border border-primary/35 bg-primary/10 px-2.5 py-1 font-mono text-[13px] font-semibold text-primary">
                {match.pred?.hs}–{match.pred?.as}
              </span>
              <p className="text-xs text-primary">TU PICK</p>
            </div>
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
