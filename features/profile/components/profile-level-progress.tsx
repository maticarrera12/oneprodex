import type { ProfileUser } from "@/features/profile/types"

type ProfileLevelProgressProps = {
  user: ProfileUser
}

export function ProfileLevelProgress({ user }: ProfileLevelProgressProps) {
  const pct = Math.round((user.levelCurrent / user.levelTarget) * 100)
  const missing = Math.max(0, user.levelTarget - user.levelCurrent)

  return (
    <section className="rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi) p-4">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] tracking-wider text-(--color-text3) uppercase">
            Level {user.level} · {user.levelTitle}
          </p>
          <p className="mt-1 text-sm">{missing} pts para Level {user.level + 1} · {user.nextLevelTitle}</p>
        </div>
        <p className="font-mono text-xs font-semibold text-(--color-primary)">
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
