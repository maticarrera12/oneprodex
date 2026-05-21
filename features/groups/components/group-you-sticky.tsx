import { GroupAvatar } from "@/features/groups/components/group-avatar"
import type { RankingEntry } from "@/features/rankings/types"

type GroupYouStickyProps = {
  you: RankingEntry
}

export function GroupYouSticky({ you }: GroupYouStickyProps) {
  return (
    <section className="sticky bottom-24 z-10">
      <div className="rounded-2xl border border-(--color-border-hi) bg-background/85 px-4 py-3 shadow-[0_12px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="w-6 font-mono text-xs text-(--color-text3)">#{you.rank}</span>
          <GroupAvatar name={you.name} color={you.color} size={32} ring />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">{you.name}</p>
            <p className="font-mono text-[11px] text-(--color-text3)">
              {you.acc}% acc · 🔥{you.streak}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-lg font-semibold text-(--color-primary) leading-none">{you.pts}</p>
            <p className="font-mono text-[10px] text-(--color-text3) uppercase">pts</p>
          </div>
        </div>
      </div>
    </section>
  )
}
