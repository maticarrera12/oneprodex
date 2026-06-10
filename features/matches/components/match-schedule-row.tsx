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
  layout?: "stacked" | "inline"
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

function LiveBadge({ minute }: { minute: number | null | undefined }) {
  return (
    <div className="shrink-0 rounded-md border border-zinc-800 px-2 py-1">
      <div className="flex min-w-[70px] flex-col items-center px-1 py-0.5">
        <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-(--color-primary)">
          En vivo
        </span>
        <p className="mt-0.5 font-mono text-sm font-semibold">{minute ?? 0}&apos;</p>
      </div>
    </div>
  )
}

function KickoffBadge({ kickoff }: { kickoff: string }) {
  const { date, time } = formatKickoffParts(kickoff)

  return (
    <div className="shrink-0 rounded-md border border-zinc-800 p-1">
      <div className="flex items-center gap-1">
        <HugeiconsIcon icon={Calendar02Icon} size={28} color="currentColor" strokeWidth={1.5} />
        <div className="flex flex-col items-center pr-0.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-zinc-400">{date}</p>
          <p className="mt-0.5 font-mono text-sm font-semibold">{time}</p>
        </div>
      </div>
    </div>
  )
}

function PredictionAction({
  match,
  hasPrediction,
  points,
  compact,
}: {
  match: Match
  hasPrediction: boolean
  points: ReturnType<typeof calcPoints> | null
  compact?: boolean
}) {
  const actionClass = compact ? "flex items-center gap-2" : "flex items-center gap-2 sm:flex-col sm:gap-1"

  if (match.status === "FINISHED" && hasPrediction) {
    return (
      <div className={actionClass}>
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
    )
  }

  if (hasPrediction) {
    return (
      <div className={actionClass}>
        <span className="inline-flex min-w-[74px] justify-center rounded-[10px] border border-primary/35 bg-primary/10 px-2.5 py-1 font-mono text-[13px] font-semibold text-primary">
          {match.pred?.hs}–{match.pred?.as}
        </span>
        <p className="text-xs text-primary">TU PICK</p>
      </div>
    )
  }

  return (
    <span className="inline-flex min-w-[74px] justify-center rounded-[10px] border border-border/80 bg-white/5 px-2.5 py-1 text-xs text-foreground/80">
      Predict
    </span>
  )
}

export function MatchScheduleRow({ match, teams, layout = "stacked" }: MatchScheduleRowProps) {
  const home = teams[match.home]
  const away = teams[match.away]
  const hasPrediction = Boolean(match.pred)
  const points = match.status === "FINISHED" ? calcPoints(match) : null
  const isLive = match.status === "LIVE"
  const showScore = isLive || match.status === "FINISHED"

  return (
    <Link href={`/partidos/${match.id}`} className="block">
      <article
        className={`rounded-xl border bg-card/90 px-3.5 py-3 ${
          isLive ? "border-l-2 border-l-(--color-lime-deep) border-border/80" : "border-border/80 border-l-primary border-l-2"
        }`}
      >
        {layout === "inline" ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <TeamBadge code={match.home} name={home?.name} logo={match.homeLogo} />
              <span className="shrink-0 text-sm font-semibold">{home?.code ?? match.home}</span>
              {showScore ? (
                <span className="shrink-0 px-0.5 font-mono text-sm font-semibold text-foreground">
                  {match.hs ?? "-"}–{match.as ?? "-"}
                </span>
              ) : (
                <span className="shrink-0 font-mono text-[11px] text-muted-foreground">vs</span>
              )}
              <TeamBadge code={match.away} name={away?.name} logo={match.awayLogo} />
              <span className="truncate text-sm font-semibold">{away?.code ?? match.away}</span>
            </div>

            {isLive ? <LiveBadge minute={match.minute} /> : <KickoffBadge kickoff={match.kickoff} />}

            <div className="shrink-0">
              <PredictionAction match={match} hasPrediction={hasPrediction} points={points} compact />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="min-w-0 space-y-2">
              <div className="flex min-w-0 items-center gap-2">
                <TeamBadge code={match.home} name={home?.name} logo={match.homeLogo} />
                <span className="min-w-10 text-sm font-semibold">{home?.code ?? match.home}</span>
                <span className="ml-auto font-mono text-sm font-semibold text-foreground">
                  {showScore ? (match.hs ?? "-") : ""}
                </span>
              </div>
              <div className="flex min-w-0 items-center gap-2">
                <TeamBadge code={match.away} name={away?.name} logo={match.awayLogo} />
                <span className="min-w-10 text-sm font-semibold">{away?.code ?? match.away}</span>
                <span className="ml-auto font-mono text-sm font-semibold text-foreground">
                  {showScore ? (match.as ?? "-") : ""}
                </span>
              </div>
            </div>

            {isLive ? <LiveBadge minute={match.minute} /> : null}

            <div className={isLive ? "col-span-2 flex justify-end sm:col-span-1" : "flex justify-end"}>
              <PredictionAction match={match} hasPrediction={hasPrediction} points={points} />
            </div>
          </div>
        )}
      </article>
    </Link>
  )
}
