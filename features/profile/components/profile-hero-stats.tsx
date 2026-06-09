import type { ProfileHeroStat } from "@/features/profile/types"

type ProfileHeroStatsProps = {
  stats: ProfileHeroStat[]
}

const STAT_ICONS = [
  // Trending up — Points
  <svg key="points" width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2 12 6 8l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 6h3v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>,
  // Trophy — Rank
  <svg key="rank" width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 10c-2.8 0-5-2.2-5-5V3h10v2c0 2.8-2.2 5-5 5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M5 13h6M8 10v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M3 3H1.5A1.5 1.5 0 0 0 0 4.5v.5C0 6.4 1.1 8 3 8M13 3h1.5A1.5 1.5 0 0 1 16 4.5v.5C16 6.4 14.9 8 13 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>,
  // Crosshair/Target — Accuracy
  <svg key="accuracy" width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
    <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.4" />
    <circle cx="8" cy="8" r="1" fill="currentColor" />
    <path d="M8 2V0M8 16v-2M2 8H0M16 8h-2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>,
  // Bars — Streak
  <svg key="streak" width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="9" width="3" height="6" rx="1" fill="currentColor" />
    <rect x="6" y="5" width="3" height="10" rx="1" fill="currentColor" />
    <rect x="11" y="1" width="3" height="14" rx="1" fill="currentColor" />
  </svg>,
]

export function ProfileHeroStats({ stats }: ProfileHeroStatsProps) {
  return (
    <section className="grid grid-cols-4 gap-2">
      {stats.map((stat, index) => (
        <article key={stat.label} className="relative overflow-hidden rounded-xl border border-(--color-border-hi) bg-(--color-card-hi) px-2 py-2.5">
          <span className="pointer-events-none absolute top-2 right-2 text-(--color-text4) opacity-30">
            {STAT_ICONS[index]}
          </span>
          <p className="font-mono text-[9.5px] tracking-wider text-(--color-text3) uppercase leading-tight pr-4">{stat.label}</p>
          <div className="mt-1 flex items-baseline gap-1">
            <p className={`font-mono text-xl font-semibold leading-none tracking-tight ${index === 1 ? "text-(--color-primary)" : ""}`}>
              {stat.value}
            </p>
            {stat.fire ? (
              <span className="text-(--color-amber)">
                <svg width="11" height="13" viewBox="0 0 11 13">
                  <path d="M5.5 0c.6 1.8 2.5 2.6 2.5 5.5a2.6 2.6 0 0 1-5 0c0-.8.4-1.3.7-1.8C2 5 1 6.5 1 8a4.5 4.5 0 0 0 9 0c0-3.5-2.5-5.5-4.5-8Z" fill="currentColor" />
                </svg>
              </span>
            ) : null}
          </div>
          {stat.sub ? <p className="mt-0.5 font-mono text-[10px] text-(--color-text3)">{stat.sub}</p> : null}
        </article>
      ))}
    </section>
  )
}
