import { ActivityRow } from "@/features/home/components/activity-row"
import { MiniPodium } from "@/features/home/components/mini-podium"
import type { ActivityItem, GroupInfo } from "@/features/groups/types"
import type { RankingEntry } from "@/features/rankings/types"

type GroupSectionProps = {
  group: GroupInfo
  top3: RankingEntry[]
  activity: ActivityItem[]
}

export function GroupSection({ group, top3, activity }: GroupSectionProps) {
  return (
    <section className="rounded-2xl border border-border/80 bg-card/95 p-4">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.04em] text-foreground/85">Group · {group.name}</h2>
          <p className="text-xs text-muted-foreground">{group.members} miembros</p>
        </div>
        <span className="text-xs font-medium text-primary">View all</span>
      </header>

      <MiniPodium top3={top3} />

      <div className="mt-3 divide-y divide-border/80 border-t border-border/80 pt-1">
        {activity.map((item) => (
          <ActivityRow key={`${item.who}-${item.time}`} item={item} />
        ))}
      </div>
    </section>
  )
}
