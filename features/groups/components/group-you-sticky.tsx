import { GroupAvatar } from "@/features/groups/components/group-avatar"
import type { RankingEntry } from "@/features/rankings/types"

type GroupYouStickyProps = {
  you: RankingEntry
}

export function GroupYouSticky({ you }: GroupYouStickyProps) {
  return (
    <section className="sticky bottom-24 z-10">
      <div className="rounded-2xl border border-primary/25 bg-background/90 px-4 py-3 shadow-[0_12px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex w-10 flex-col items-center">
            <span className="font-mono text-[10px] text-primary">#{you.rank}</span>
            <span className="text-sm leading-none text-primary/70" aria-hidden>
              ❧
            </span>
          </div>
          <GroupAvatar name={you.name} color={you.color} size={36} ring />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{you.name}</p>
            <p className="font-mono text-[10px] text-(--color-text3)">
              Mejor racha: {you.streak} aciertos
            </p>
          </div>
          <div className="text-center">
            <p className="font-mono text-[10px] uppercase tracking-wider text-(--color-text3)">Precisión</p>
            <p className="font-mono text-sm font-semibold text-foreground">{you.acc}%</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-lg font-semibold leading-none text-primary">{you.pts}</p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-(--color-text3)">pts</p>
          </div>
        </div>
      </div>
    </section>
  )
}
