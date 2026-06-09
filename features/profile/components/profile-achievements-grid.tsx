"use client"

import { useState } from "react"
import Link from "next/link"
import type { ProfileAchievement } from "@/features/profile/types"

type ProfileAchievementsGridProps = {
  achievements: ProfileAchievement[]
}

export function ProfileAchievementsGrid({ achievements }: ProfileAchievementsGridProps) {
  const earnedCount = achievements.filter((a) => a.got).length
  const visible = achievements.slice(0, 3)

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold tracking-wider text-(--color-text2) uppercase">Achievements</h2>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-(--color-text3)">{earnedCount} / {achievements.length}</span>
          <Link
            href="/perfil/logros"
            className="font-mono text-xs font-semibold text-(--color-primary) uppercase tracking-wider"
          >
            Ver todos
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {visible.map((a) => <AchievementCard key={a.id} achievement={a} />)}
      </div>
    </section>
  )
}

export function AchievementCard({ achievement }: { achievement: ProfileAchievement }) {
  const isActive = achievement.got

  return (
    <article className={`flex flex-col rounded-xl border p-3 text-center ${
      isActive
        ? "border-(--color-lime-deep) bg-(--color-lime-bg)"
        : "border-(--color-border-hi) bg-(--color-card-hi)"
    }`}>
      <AchievementBadge id={achievement.id} icon={achievement.icon} active={isActive} size={44} />
      <p className="text-[11px] font-bold leading-tight">{achievement.name}</p>
      {achievement.tier && (
        <p className={`mt-0.5 font-mono text-[9px] font-bold uppercase tracking-wide ${TIER_COLOR[achievement.tier] ?? ""}`}>
          {achievement.tier}
        </p>
      )}
      <div className="mt-2">
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all ${isActive ? "bg-(--color-primary)" : "bg-white/20"}`}
            style={{ width: `${Math.round(achievement.progressRatio * 100)}%` }}
          />
        </div>
        <p className={`mt-1 font-mono text-[10px] font-semibold ${isActive ? "text-(--color-primary)" : "text-(--color-text4)"}`}>
          {achievement.progress}
        </p>
      </div>
    </article>
  )
}

export function AchievementBadge({
  id,
  icon,
  active,
  size = 44,
  fill = false,
}: {
  id: string
  icon: ProfileAchievement["icon"]
  active: boolean
  size?: number
  fill?: boolean
}) {
  const [failed, setFailed] = useState(false)
  const sizeStyle = fill ? {} : { width: size, height: size }
  const sizeClass = fill ? "w-full h-full" : "shrink-0"

  if (!failed) {
    return (
      <img
        src={`/achievements/${id}.png`}
        alt={id}
        width={fill ? undefined : size}
        height={fill ? undefined : size}
        style={sizeStyle}
        className={`mx-auto mb-2 object-contain drop-shadow-sm ${sizeClass} ${!active ? "opacity-40 grayscale" : ""}`}
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <div
      style={sizeStyle}
      className={`mx-auto mb-2 inline-flex items-center justify-center rounded-xl ${sizeClass} ${
        active
          ? "bg-linear-to-br from-(--color-primary) to-(--color-lime-deep) text-black"
          : "bg-white/8 text-(--color-text3)"
      }`}
    >
      <AchievementIcon icon={icon} />
    </div>
  )
}

export function AchievementImage({
  id,
  icon,
  size = 32,
}: {
  id: string
  icon: ProfileAchievement["icon"]
  size?: number
}) {
  const [failed, setFailed] = useState(false)

  if (!failed) {
    return (
      <img
        src={`/achievements/${id}.png`}
        alt={id}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="object-contain drop-shadow-sm"
        onError={() => setFailed(true)}
      />
    )
  }

  return <AchievementIcon icon={icon} />
}

const TIER_COLOR: Record<string, string> = {
  bronze: "text-amber-600",
  silver: "text-slate-400",
  gold: "text-yellow-400",
}

export function AchievementIcon({ icon }: { icon: ProfileAchievement["icon"] }) {
  if (icon === "target") {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="10" cy="10" r="1.5" fill="currentColor" />
        <path d="M10 2V0M10 20v-2M2 10H0M20 10h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  }
  if (icon === "calendar") {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="4" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2 8h16M7 2v4M13 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="6" y="11" width="2.5" height="2.5" rx="0.5" fill="currentColor" />
        <rect x="11" y="11" width="2.5" height="2.5" rx="0.5" fill="currentColor" />
      </svg>
    )
  }
  if (icon === "trophy") {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 13C6.5 13 4 10.5 4 7V4h12v3c0 3.5-2.5 6-6 6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M7 17h6M10 13v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M4 4H2a2 2 0 0 0-2 2v1c0 2 1.5 3.5 4 4M16 4h2a2 2 0 0 1 2 2v1c0 2-1.5 3.5-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  }
  if (icon === "star") {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2l2.4 5.4L18 8.6l-4 3.9.9 5.5L10 15.4 5.1 18l.9-5.5L2 8.6l5.6-.8L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    )
  }
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M4 10 8.5 14.5 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
