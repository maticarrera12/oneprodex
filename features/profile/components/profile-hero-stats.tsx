import type { ProfileHeroStat } from "@/features/profile/types"

type ProfileHeroStatsProps = {
  stats: ProfileHeroStat[]
}

export function ProfileHeroStats({ stats }: ProfileHeroStatsProps) {
  return (
    <section className="grid grid-cols-4 gap-2">
      {stats.map((stat) => (
        <article key={stat.label} className="rounded-xl border border-(--color-border-hi) bg-(--color-card-hi) px-2 py-2.5">
          <p className="font-mono text-[9.5px] tracking-wider text-(--color-text3) uppercase">{stat.label}</p>
          <div className="mt-1 flex items-baseline gap-1">
            <p className="font-mono text-xl font-semibold leading-none tracking-tight">{stat.value}</p>
            {stat.fire ? (
              <span className="text-(--color-amber)">
                <svg width="11" height="13" viewBox="0 0 11 13">
                  <path d="M5.5 0c.6 1.8 2.5 2.6 2.5 5.5a2.6 2.6 0 0 1-5 0c0-.8.4-1.3.7-1.8C2 5 1 6.5 1 8a4.5 4.5 0 0 0 9 0c0-3.5-2.5-5.5-4.5-8Z" fill="currentColor" />
                </svg>
              </span>
            ) : null}
          </div>
          {stat.delta ? <p className="mt-0.5 font-mono text-[10px] font-semibold text-(--color-primary)">{stat.delta}</p> : null}
          {stat.sub ? <p className="mt-0.5 font-mono text-[10px] text-(--color-text3)">{stat.sub}</p> : null}
        </article>
      ))}
    </section>
  )
}
