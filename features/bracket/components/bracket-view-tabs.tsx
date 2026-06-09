const BRACKET_VIEW_TABS = ["Mis picks", "Actual"] as const

export type BracketViewTab = (typeof BRACKET_VIEW_TABS)[number]

type BracketViewTabsProps = {
  active: BracketViewTab
  onChange: (tab: BracketViewTab) => void
}

export function BracketViewTabs({ active, onChange }: BracketViewTabsProps) {
  return (
    <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1">
      {BRACKET_VIEW_TABS.map((label) => {
        const isActive = label === active
        return (
          <button
            key={label}
            type="button"
            onClick={() => onChange(label)}
            className={`rounded-full border px-3 py-1.5 text-sm ${
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
