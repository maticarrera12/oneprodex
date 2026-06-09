import type { ProfileUser } from "@/features/profile/types"

type ProfileLevelProgressProps = {
  user: ProfileUser
}

export function ProfileLevelProgress({ user }: ProfileLevelProgressProps) {
  const pct = user.levelTarget > 0 ? Math.round((user.levelCurrent / user.levelTarget) * 100) : 0
  const missing = Math.max(0, user.levelTarget - user.levelCurrent)

  return (
    <section className="rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi) p-4">
      <div className="mb-3 flex items-center gap-3">
        <HexShield level={user.level} />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] tracking-wider text-(--color-text3) uppercase">
            Level {user.level} · {user.levelTitle}
          </p>
          <p className="mt-0.5 text-sm">{missing} pts para Level {user.level + 1} · {user.nextLevelTitle}</p>
        </div>
        <p className="font-mono text-xs font-semibold text-(--color-primary) shrink-0">
          {user.levelCurrent} / {user.levelTarget}
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded bg-white/6">
        <div
          className="h-full rounded bg-linear-to-r from-(--color-lime-deep) to-(--color-primary) shadow-[0_0_10px_rgba(190,242,100,0.4)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </section>
  )
}

function HexShield({ level }: { level: number }) {
  return (
    <div className="relative shrink-0 flex items-center justify-center" style={{ width: 40, height: 44 }}>
      <svg width="40" height="44" viewBox="0 0 40 44" fill="none" className="absolute inset-0">
        <path
          d="M20 1 37 10.5v21L20 42 3 31.5v-21L20 1Z"
          stroke="var(--color-primary)"
          strokeWidth="1.5"
          fill="var(--color-lime-bg)"
        />
      </svg>
      <span className="relative font-mono text-sm font-bold text-(--color-primary) leading-none">
        {level}
      </span>
    </div>
  )
}
