import type { RankingEntry } from "@/features/rankings/types"

type MiniPodiumProps = {
  top3: RankingEntry[]
}

export function MiniPodium({ top3 }: MiniPodiumProps) {
  return (
    <div className="flex gap-2.5">
      {top3.map((entry, index) => (
        <article
          key={entry.handle}
          className={`flex min-w-0 flex-1 items-center gap-2 rounded-xl border px-2.5 py-2 ${
            entry.rank === 1
              ? "border-primary/30 bg-primary/10"
              : "border-border/80 bg-white/4"
          }`}
        >
          <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-card text-[11px] font-semibold text-foreground ring-1 ring-white/10">
            {entry.handle.slice(1, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[10px] text-muted-foreground">#{entry.rank}</p>
            <p className={`truncate text-xs font-semibold ${index === 0 ? "text-primary" : "text-foreground"}`}>
              {entry.handle}
            </p>
          </div>
        </article>
      ))}
    </div>
  )
}
