const LEADERBOARD_TABS = ["Esta semana", "Torneo", "Grupos", "Knockout"] as const

type GroupLeaderboardTabsProps = {
  active: (typeof LEADERBOARD_TABS)[number]
  onChange: (value: (typeof LEADERBOARD_TABS)[number]) => void
}

export function GroupLeaderboardTabs({ active, onChange }: GroupLeaderboardTabsProps) {
  return (
    <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1">
      {LEADERBOARD_TABS.map((label) => {
        const isActive = label === active
        return (
          <button
            key={label}
            type="button"
            onClick={() => onChange(label)}
            className={`rounded-full border px-3 py-1.5 text-sm whitespace-nowrap ${
              isActive
                ? "border-(--color-border-hi) bg-(--color-card-hi) text-foreground"
                : "border-(--color-border-hi) text-(--color-text2)"
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

export type LeaderboardTab = (typeof LEADERBOARD_TABS)[number]
