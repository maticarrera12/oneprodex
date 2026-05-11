import { Flag } from "@/features/home/components/flag"
import type { BracketMatch } from "@/features/bracket/types"

type BracketMatchCardProps = {
  match: BracketMatch
  final?: boolean
}

export function BracketMatchCard({ match, final = false }: BracketMatchCardProps) {
  const empty = match.a === "???"
  const aWon = match.done && (match.sa !== null && match.sb !== null) && (match.sa > match.sb || (match.pen && (match.sap ?? -1) > (match.sbp ?? -1)))
  const bWon = match.done && (match.sa !== null && match.sb !== null) && (match.sb > match.sa || (match.pen && (match.sbp ?? -1) > (match.sap ?? -1)))

  return (
    <article
      className={`h-[110px] overflow-hidden rounded-2xl border ${
        final ? "border-(--color-lime-deep) bg-(--color-lime-bg)" : "border-(--color-border-hi) bg-(--color-card-hi)"
      }`}
    >
      <div className="flex items-center justify-between border-b border-(--color-border-hi) px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-(--color-text3)">
        <span>{match.done ? "Final" : match.kickoff ?? "TBD"}</span>
        {match.pen ? <span className="text-(--color-amber)">PEN</span> : null}
        {!match.done && !empty ? <span className="text-(--color-lime-hi)">abierto</span> : null}
      </div>

      <BracketTeam code={match.a} score={match.sa} pen={match.sap} won={aWon} dimmed={bWon || empty} />
      <div className="h-px bg-(--color-border-hi)" />
      <BracketTeam code={match.b} score={match.sb} pen={match.sbp} won={bWon} dimmed={aWon || empty} />
    </article>
  )
}

function BracketTeam({
  code,
  score,
  pen,
  won,
  dimmed,
}: {
  code: string
  score: number | null
  pen: number | null
  won: boolean
  dimmed: boolean
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
        <Flag code={code} size={22} />
      )}

      <span className={`flex-1 text-sm font-semibold ${empty ? "text-(--color-text3)" : won ? "text-(--color-lime-hi)" : "text-foreground"}`}>
        {empty ? "TBD" : code}
      </span>

      {score !== null ? (
        <span className="inline-flex items-baseline gap-1 font-mono">
          <span className={`text-base font-semibold ${won ? "text-(--color-lime-hi)" : "text-foreground"}`}>{score}</span>
          {pen !== null ? <span className="text-[10px] text-(--color-amber)">({pen})</span> : null}
        </span>
      ) : (
        <span className="font-mono text-xs text-(--color-text4)">—</span>
      )}
    </div>
  )
}
