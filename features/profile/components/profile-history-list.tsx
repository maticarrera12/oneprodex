import type { ProfileHistoryEntry } from "@/features/profile/types"

type ProfileHistoryListProps = {
  entries: ProfileHistoryEntry[]
}

export function ProfileHistoryList({ entries }: ProfileHistoryListProps) {
  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold tracking-wider text-(--color-text2) uppercase">Recent predictions</h2>
      <div className="overflow-hidden rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi)">
        {entries.map((entry, index) => {
          const isLast = index === entries.length - 1
          const tone =
            entry.kind === "exact"
              ? "bg-(--color-lime-hi)"
              : entry.kind === "result"
                ? "bg-(--color-amber)"
                : "bg-(--color-text4)"

          return (
            <article key={`${entry.match}-${index}`} className={`flex items-center gap-3 px-3.5 py-3 ${isLast ? "" : "border-b border-(--color-border-hi)"}`}>
              <span className={`h-7 w-1 rounded-full ${tone} ${entry.kind === "miss" ? "opacity-50" : ""}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-sm font-semibold">{entry.match}</p>
                <p className="mt-0.5 font-mono text-[11px] text-(--color-text3)">
                  You · {entry.mine} · {entry.kind === "exact" ? "Exact score" : entry.kind === "result" ? "Result only" : "Missed"}
                </p>
              </div>
              <p className={`font-mono text-sm font-semibold ${entry.pts > 0 ? "text-(--color-lime-hi)" : "text-(--color-text3)"}`}>
                {entry.pts > 0 ? "+" : ""}
                {entry.pts}
              </p>
            </article>
          )
        })}
      </div>
    </section>
  )
}
