import { BracketMatchCard } from "@/features/bracket/components/bracket-match-card"
import type { BracketRound } from "@/features/bracket/types"

type BracketRoundColumnProps = {
  round: BracketRound
  positions: number[]
  columnHeight: number
}

export function BracketRoundColumn({ round, positions, columnHeight }: BracketRoundColumnProps) {
  const widthClass = round.wide ? "w-[220px]" : "w-[200px]"

  return (
    <section className={`${widthClass} shrink-0`}>
      <h3 className="mb-2 px-1 font-mono text-[10px] uppercase tracking-wider text-(--color-text3)">
        {round.title}
      </h3>
      <div className="relative" style={{ height: columnHeight }}>
        {round.matches.map((match, index) => (
          <div key={match.id} className="absolute inset-x-0" style={{ top: positions[index] ?? 0 }}>
            <BracketMatchCard match={match} final={Boolean(round.final)} />
          </div>
        ))}
      </div>
    </section>
  )
}
