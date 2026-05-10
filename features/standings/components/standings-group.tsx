import { StandingsRow } from "@/features/standings/components/standings-row"
import type { StandingGroup } from "@/features/standings/types"

type StandingsGroupProps = {
  group: StandingGroup
}

export default function StandingsGroupSection({ group }: StandingsGroupProps) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-foreground">{group.name}</h2>
      <div className="overflow-hidden rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi)">
        <div className="grid grid-cols-[24px_28px_26px_26px_26px_26px_34px_34px_54px] items-center gap-1.5 border-b border-(--color-border-hi) px-3 py-2 font-mono text-[10px] tracking-wider text-(--color-text3) uppercase">
          <span />
          <span />
          <span className="text-center">PJ</span>
          <span className="text-center">G</span>
          <span className="text-center">E</span>
          <span className="text-center">P</span>
          <span className="text-center">GD</span>
          <span className="text-center">Pts</span>
          <span className="text-right">Forma</span>
        </div>
        <div>
          {group.rows.map((row, index) => (
            <StandingsRow
              key={`${group.id}-${row.team}`}
              row={row}
              position={index + 1}
              index={index}
              showBorder={index < group.rows.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
