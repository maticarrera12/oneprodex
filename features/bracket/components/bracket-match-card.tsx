import { useEffect, useRef, useState } from "react"
import { TeamLogo } from "@/features/shared/components/team-logo"
import type { BracketMatch } from "@/features/bracket/types"

type BracketMatchCardProps = {
  match: BracketMatch
  final?: boolean
  onPickScore?: (matchId: string, home: number, away: number) => void
  userScore?: { home: number; away: number } | null
}

export function BracketMatchCard({ match, final = false, onPickScore, userScore }: BracketMatchCardProps) {
  const empty = match.a === "???"
  const aWon = match.done && (match.sa !== null && match.sb !== null) && (match.sa > match.sb || (match.pen && (match.sap ?? -1) > (match.sbp ?? -1)))
  const bWon = match.done && (match.sa !== null && match.sb !== null) && (match.sb > match.sa || (match.pen && (match.sbp ?? -1) > (match.sap ?? -1)))
  const canPick = Boolean(onPickScore && match.matchId && !match.done && !empty)

  const [home, setHome] = useState<number | null>(userScore?.home ?? null)
  const [away, setAway] = useState<number | null>(userScore?.away ?? null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  function scheduleSave(nextHome: number | null, nextAway: number | null) {
    if (nextHome === null || nextAway === null || !match.matchId || !onPickScore) return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => onPickScore(match.matchId!, nextHome, nextAway), 600)
  }
  function bumpHome(next: number | null) {
    setHome(next)
    scheduleSave(next, away)
  }
  function bumpAway(next: number | null) {
    setAway(next)
    scheduleSave(home, next)
  }

  return (
    <article
      className={`h-[110px] overflow-hidden rounded-2xl border ${
        final ? "border-(--color-lime-deep) bg-(--color-lime-bg)" : "border-(--color-border-hi) bg-(--color-card-hi)"
      }`}
    >
      <div className="flex items-center justify-between border-b border-(--color-border-hi) px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-(--color-text3)">
        <span>{match.done ? "Final" : match.kickoff ?? "TBD"}</span>
        {match.pen ? <span className="text-(--color-amber)">PEN</span> : null}
        {!match.done && !empty ? <span className="text-(--color-primary)">abierto</span> : null}
      </div>

      <BracketTeam
        code={match.a}
        logo={match.logoA}
        score={canPick ? home : match.sa}
        pen={match.sap}
        won={aWon}
        dimmed={bWon || empty}
        editable={canPick}
        onBump={bumpHome}
      />
      <div className="h-px bg-(--color-border-hi)" />
      <BracketTeam
        code={match.b}
        logo={match.logoB}
        score={canPick ? away : match.sb}
        pen={match.sbp}
        won={bWon}
        dimmed={aWon || empty}
        editable={canPick}
        onBump={bumpAway}
      />
    </article>
  )
}

function BracketTeam({
  code,
  logo,
  score,
  pen,
  won,
  dimmed,
  editable = false,
  onBump,
}: {
  code: string
  logo: string | null
  score: number | null
  pen: number | null
  won: boolean
  dimmed: boolean
  editable?: boolean
  onBump?: (next: number | null) => void
}) {
  const empty = code === "???"

  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-2.5 ${won ? "bg-(--color-lime-bg)" : ""}`}
      style={{ opacity: dimmed && !empty ? 0.48 : 1 }}
    >
      {empty ? (
        <span className="inline-flex size-[22px] rounded-full border border-dashed border-(--color-border-hi)" />
      ) : (
        <TeamLogo code={code} logo={logo} size={22} />
      )}

      <span className={`flex-1 text-sm font-semibold ${empty ? "text-(--color-text3)" : won ? "text-(--color-primary)" : "text-foreground"}`}>
        {empty ? "TBD" : code}
      </span>

      {editable && onBump ? (
        <span className="inline-flex items-center gap-1">
          <button
            type="button"
            aria-label={`Restar goles ${code}`}
            disabled={score === null}
            onClick={() => onBump(score !== null && score > 0 ? score - 1 : null)}
            className="inline-flex size-5 items-center justify-center rounded border border-(--color-border-hi) bg-(--color-card-hi) text-[11px] leading-none text-foreground disabled:opacity-40"
          >
            −
          </button>
          <span className="w-3 text-center font-mono text-sm font-semibold">{score ?? "-"}</span>
          <button
            type="button"
            aria-label={`Sumar goles ${code}`}
            onClick={() => onBump(score === null ? 0 : score + 1)}
            className="inline-flex size-5 items-center justify-center rounded border border-(--color-border-hi) bg-(--color-card-hi) text-[11px] leading-none text-foreground"
          >
            +
          </button>
        </span>
      ) : score !== null ? (
        <span className="inline-flex items-baseline gap-1 font-mono">
          <span className={`text-base font-semibold ${won ? "text-(--color-primary)" : "text-foreground"}`}>{score}</span>
          {pen !== null ? <span className="text-[10px] text-(--color-amber)">({pen})</span> : null}
        </span>
      ) : (
        <span className="font-mono text-xs text-(--color-text4)">—</span>
      )}
    </div>
  )
}
