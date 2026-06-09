"use client"

import type { ProfileAchievement } from "@/features/profile/types"
import { AchievementBadge } from "@/features/profile/components/profile-achievements-grid"

type Props = {
  achievements: ProfileAchievement[]
}

export function ProfileAchievementsFull({ achievements }: Props) {
  const earned = achievements.filter((a) => a.got)
  const locked = achievements.filter((a) => !a.got)

  return (
    <div className="space-y-6">
      {earned.length > 0 && (
        <section>
          <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-(--color-text3)">
            Conseguidos · {earned.length}
          </p>
          <div className="grid grid-cols-5 gap-2">
            {earned.map((a) => <AchievementSquare key={a.id} achievement={a} />)}
          </div>
        </section>
      )}

      {locked.length > 0 && (
        <section>
          <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-(--color-text3)">
            Bloqueados · {locked.length}
          </p>
          <div className="grid grid-cols-5 gap-2">
            {locked.map((a) => <AchievementSquare key={a.id} achievement={a} />)}
          </div>
        </section>
      )}

      {achievements.length === 0 && (
        <p className="py-12 text-center font-mono text-xs text-(--color-text4)">
          No hay logros disponibles todavía
        </p>
      )}
    </div>
  )
}

function AchievementSquare({ achievement }: { achievement: ProfileAchievement }) {
  const isActive = achievement.got

  return (
    <article className={`aspect-square flex flex-col items-center justify-between rounded-xl border p-1.5 text-center ${
      isActive
        ? "border-(--color-lime-deep) bg-(--color-lime-bg)"
        : "border-(--color-border-hi) bg-(--color-card-hi)"
    }`}>
      <div className="w-full flex-1 min-h-0">
        <AchievementBadge id={achievement.id} icon={achievement.icon} active={isActive} fill />
      </div>

      <p className="w-full text-[10px] font-bold leading-tight">{achievement.name}</p>

      <div className="mt-1 w-full">
        <div className="h-0.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isActive ? "bg-(--color-primary)" : "bg-white/20"}`}
            style={{ width: `${Math.round(achievement.progressRatio * 100)}%` }}
          />
        </div>
        <p className={`mt-0.5 font-mono text-[8px] font-semibold ${isActive ? "text-(--color-primary)" : "text-(--color-text4)"}`}>
          {achievement.progress}
        </p>
      </div>
    </article>
  )
}

const TIER_COLOR: Record<string, string> = {
  bronze: "text-amber-600",
  silver: "text-slate-400",
  gold: "text-yellow-400",
}
