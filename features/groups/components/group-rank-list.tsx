import { GroupRankRow } from "@/features/groups/components/group-rank-row"
import type { RankingEntry } from "@/features/rankings/types"

type GroupRankListProps = {
  leaderboard: RankingEntry[]
  pulseHandle: string | null
}

export function GroupRankList({ leaderboard, pulseHandle }: GroupRankListProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi)">
      <div className="grid grid-cols-[28px_minmax(0,1fr)_88px_56px_56px] items-center gap-2 border-b border-(--color-border-hi) px-3 py-2.5 font-mono text-[10px] tracking-wider text-(--color-text3) uppercase">
        <span className="text-center">#</span>
        <span>Participante</span>
        <span className="text-center">Precisión</span>
        <span className="text-center">Acertos</span>
        <span className="text-right">Puntos</span>
      </div>
      {leaderboard.map((entry, index) => (
        <GroupRankRow
          key={entry.handle}
          entry={entry}
          pulse={pulseHandle === entry.handle}
          showBorder={index < leaderboard.length - 1}
        />
      ))}
    </section>
  )
}
