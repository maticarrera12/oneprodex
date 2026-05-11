import { GroupRankRow } from "@/features/groups/components/group-rank-row"
import type { RankingEntry } from "@/features/rankings/types"

type GroupRankListProps = {
  leaderboard: RankingEntry[]
  pulseHandle: string | null
}

export function GroupRankList({ leaderboard, pulseHandle }: GroupRankListProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi)">
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
