import Link from "next/link"
import type { ReactNode } from "react"
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
    <div className="shrink-0 rounded-md border border-zinc-800 p-0.5 sm:p-1">
      <div className="flex items-center gap-0.5 sm:gap-1">
        <HugeiconsIcon
          icon={Calendar02Icon}
          size={18}
          color="currentColor"
          strokeWidth={1.5}
          className="sm:hidden"
        />
        <HugeiconsIcon
          icon={Calendar02Icon}
          size={28}
          color="currentColor"
          strokeWidth={1.5}
          className="hidden sm:block"
        />
        <div className="flex flex-col items-center pr-0.5">
          <p className="font-mono text-[8px] uppercase tracking-[0.04em] text-zinc-400 sm:text-[10px]">{date}</p>
          <p className="font-mono text-[11px] font-semibold leading-none sm:mt-0.5 sm:text-sm">{time}</p>
        </div>
      </div>
    </div>
  )
}

function PredictionBadge({
  children,
  tone = "pick",
}: {
  children: ReactNode
  tone?: "pick" | "exact" | "winner" | "miss" | "neutral"
}) {
  const toneClass =
    tone === "exact"
      ? "border-primary/35 bg-primary/10 text-primary"
      : tone === "winner"
        ? "border-(--color-amber)/35 bg-(--color-amber)/10 text-(--color-amber)"
        : tone === "miss"
          ? "border-border/80 bg-white/5 text-muted-foreground"
          : tone === "pick"
            ? "border-primary/35 bg-primary/10 text-primary"
            : "border-border/80 bg-white/5 text-foreground/80"

  return (
    <span
      className={`inline-flex min-w-7 justify-center rounded-[10px] border px-1.5 py-0.5 font-mono text-sm font-semibold ${toneClass}`}
    >
      {children}
    </span>
  )
}

function predictionTone(points: ReturnType<typeof calcPoints> | null): "exact" | "winner" | "miss" | "pick" {
  if (!points) return "pick"
  if (points.exact) return "exact"
  if (points.winner) return "winner"
  return "miss"
}

function PredictionAction({
  match,
  hasPrediction,
  points,
}: {
  match: Match
  hasPrediction: boolean
  points: ReturnType<typeof calcPoints> | null
}) {
  const tone = match.status === "FINISHED" ? predictionTone(points) : "pick"

  if (hasPrediction) {
    return (
      <PredictionBadge tone={tone}>
        {match.pred?.hs}–{match.pred?.as}
      </PredictionBadge>
    )
  }

  return (
    <span className="inline-flex min-w-[74px] justify-center rounded-[10px] border border-border/80 bg-white/5 px-2.5 py-1 text-xs text-foreground/80">
      Predict
    </span>
  )
}

function MatchStatusBadge({ isLive, minute, kickoff }: { isLive: boolean; minute: number | null | undefined; kickoff: string }) {
  return isLive ? <LiveBadge minute={minute} /> : <KickoffBadge kickoff={kickoff} />
}

type MatchScheduleRowBodyProps = {
  match: Match
  teams: Record<string, Team>
  layout: "inline" | "stacked"
}

function MatchScheduleRowBody({ match, teams, layout }: MatchScheduleRowBodyProps) {
  const home = teams[match.home]
  const away = teams[match.away]
  const hasPrediction = Boolean(match.pred)
  const points = match.status === "FINISHED" ? calcPoints(match) : null
  const isLive = match.status === "LIVE"
  const showScore = isLive || match.status === "FINISHED"

  if (layout === "inline") {
    const showPoints = hasPrediction && match.status === "FINISHED"
    const teamsBlock = (
      <div className="flex min-w-0 items-center gap-1.5">
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
    )
    const actionsBlock = (
      <div className="flex shrink-0 items-center gap-1">
        <MatchStatusBadge isLive={isLive} minute={match.minute} kickoff={match.kickoff} />
        <PredictionAction match={match} hasPrediction={hasPrediction} points={points} />
        {showPoints ? <p className="text-xs text-muted-foreground">{points?.pts ?? 0} pts</p> : null}
      </div>
    )

    return (
      <>
        <div className="flex items-center justify-between gap-2 sm:hidden">
          <div className="min-w-0 flex-1">{teamsBlock}</div>
          {actionsBlock}
        </div>

        <div className="hidden grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-3 sm:grid">
          <div className="col-start-1 flex min-w-0 items-center gap-1.5">{teamsBlock}</div>
          <div className="col-start-2 flex justify-center">
            <MatchStatusBadge isLive={isLive} minute={match.minute} kickoff={match.kickoff} />
          </div>
          <div className="col-start-3 flex items-center justify-end gap-2">
            <PredictionAction match={match} hasPrediction={hasPrediction} points={points} />
            {showPoints ? <p className="text-xs text-muted-foreground">{points?.pts ?? 0} pts</p> : null}
          </div>
        </div>
      </>
    )
  }

  const predTone = match.status === "FINISHED" ? predictionTone(points) : "pick"
  const showPoints = hasPrediction && match.status === "FINISHED"

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_1fr_auto] items-center gap-x-2 gap-y-2">
      <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-2">
        <TeamBadge code={match.home} name={home?.name} logo={match.homeLogo} />
        <span className="text-sm font-semibold">{home?.code ?? match.home}</span>
      </div>

      <div className="col-start-2 row-start-1 row-span-2 flex items-center justify-center px-0.5">
        <MatchStatusBadge isLive={isLive} minute={match.minute} kickoff={match.kickoff} />
      </div>

      {hasPrediction ? (
        <>
          <div className="col-start-3 row-start-1 flex items-center justify-end gap-2">
            {showScore ? <span className="w-4 text-right font-mono text-sm font-semibold text-foreground">{match.hs ?? "-"}</span> : null}
            <PredictionBadge tone={predTone}>{match.pred?.hs}</PredictionBadge>
          </div>
          <div className="col-start-3 row-start-2 flex items-center justify-end gap-2">
            {showScore ? <span className="w-4 text-right font-mono text-sm font-semibold text-foreground">{match.as ?? "-"}</span> : null}
            <PredictionBadge tone={predTone}>{match.pred?.as}</PredictionBadge>
          </div>
          {showPoints ? (
            <p className="col-start-4 row-start-1 row-span-2 self-center text-xs text-muted-foreground">{points?.pts ?? 0} pts</p>
          ) : null}
        </>
      ) : (
        <div className="col-start-3 row-start-1 row-span-2 flex items-center justify-end">
          <PredictionAction match={match} hasPrediction={hasPrediction} points={points} />
        </div>
      )}

      <div className="col-start-1 row-start-2 flex min-w-0 items-center gap-2">
        <TeamBadge code={match.away} name={away?.name} logo={match.awayLogo} />
        <span className="text-sm font-semibold">{away?.code ?? match.away}</span>
      </div>
    </div>
  )
}

export function MatchScheduleRow({ match, teams, layout = "stacked" }: MatchScheduleRowProps) {
  const isLive = match.status === "LIVE"

  return (
    <Link href={`/partidos/${match.id}`} className="block">
      <article
        className={`rounded-xl border bg-card/90 px-3.5 py-3 ${
          isLive ? "border-l-2 border-l-(--color-lime-deep) border-border/80" : "border-border/80 border-l-primary border-l-2"
        }`}
      >
        {layout === "inline" ? (
          <MatchScheduleRowBody match={match} teams={teams} layout="inline" />
        ) : (
          <>
            <div className="md:hidden">
              <MatchScheduleRowBody match={match} teams={teams} layout="stacked" />
            </div>
            <div className="hidden md:block">
              <MatchScheduleRowBody match={match} teams={teams} layout="inline" />
            </div>
          </>
        )}
      </article>
    </Link>
  )
}
