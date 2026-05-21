import type { BracketScoreStat } from "@/features/bracket/types"

type BracketScoreCardProps = {
  stats: BracketScoreStat[]
}

export function BracketScoreCard({ stats }: BracketScoreCardProps) {
  return (
    <section>
      <h2 className="mb-2 font-mono text-xs uppercase tracking-wider text-(--color-text3)">Tu score del bracket</h2>
      <div className="rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi) p-3">
        <div className="grid grid-cols-4 gap-2.5">
          {stats.map((stat) => (
            <article
              key={stat.label}
              className={`rounded-xl border px-1 py-2 text-center ${
                stat.hot
                  ? "border-(--color-lime-deep) bg-(--color-lime-bg)"
                  : "border-(--color-border-hi) bg-white/3"
              }`}
            >
              <p className={`font-mono text-[10px] uppercase tracking-wider ${stat.hot ? "text-(--color-primary)" : "text-(--color-text3)"}`}>
                {stat.label}
              </p>
              <p className="mt-1 font-mono text-[15px] font-semibold tracking-tight text-foreground">{stat.got}</p>
              <p className={`mt-0.5 font-mono text-xs font-semibold ${stat.hot ? "text-(--color-primary)" : "text-(--color-text3)"}`}>
                {stat.pts}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
