import Link from "next/link"

import type { RankingEntry } from "@/features/rankings/types"
import { GroupAvatar } from "@/features/groups/components/group-avatar"

type GroupPodiumItemProps = {
  entry: RankingEntry | undefined
  position: 1 | 2 | 3
  isLeader?: boolean
}

const POSITION_THEME = {
  1: {
    ring: "var(--color-lime-mid)",
    halo: "rgba(190,242,100,0.22)",
    glow: "0 0 28px rgba(190,242,100,0.55), 0 0 56px rgba(190,242,100,0.18), inset 0 0 18px rgba(190,242,100,0.12)",
    pulse: "rgba(190,242,100,0.35)",
    badge: "bg-primary text-primary-foreground shadow-[0_0_16px_rgba(190,242,100,0.45)]",
    points: "text-primary",
  },
  2: {
    ring: "var(--color-blue)",
    halo: "rgba(96,165,250,0.2)",
    glow: "0 0 24px rgba(96,165,250,0.5), 0 0 48px rgba(96,165,250,0.16), inset 0 0 16px rgba(96,165,250,0.1)",
    pulse: "rgba(96,165,250,0.32)",
    badge: "bg-(--color-blue) text-white shadow-[0_0_14px_rgba(96,165,250,0.4)]",
    points: "text-(--color-blue)",
  },
  3: {
    ring: "var(--color-violet)",
    halo: "rgba(167,139,250,0.2)",
    glow: "0 0 24px rgba(167,139,250,0.48), 0 0 48px rgba(167,139,250,0.15), inset 0 0 16px rgba(167,139,250,0.1)",
    pulse: "rgba(167,139,250,0.32)",
    badge: "bg-(--color-violet) text-white shadow-[0_0_14px_rgba(167,139,250,0.38)]",
    points: "text-(--color-violet)",
  },
} as const

export function GroupPodiumItem({ entry, position, isLeader = false }: GroupPodiumItemProps) {
  if (!entry) return null

  const theme = POSITION_THEME[position]
  const size = isLeader ? 72 : 54
  const outer = size + (isLeader ? 16 : 14)
  const displayName = `${entry.name.split(" ")[0]} ${entry.name.split(" ")[1]?.slice(0, 1) ?? ""}.`.trim()
  const href = entry.isYou ? "/perfil" : `/perfil/${entry.handle}`

  return (
    <Link href={href} className="pointer-events-auto flex flex-col items-center gap-1.5">
      <div className="relative flex items-center justify-center" style={{ width: outer, height: outer }}>
        <span
          aria-hidden="true"
          className="absolute inset-0 animate-pulse rounded-full"
          style={{
            background: `radial-gradient(circle, ${theme.halo} 0%, transparent 70%)`,
            transform: "scale(1.18)",
          }}
        />
        <span
          aria-hidden="true"
          className="absolute inset-[6%] rounded-full border border-white/10"
          style={{ boxShadow: `0 0 20px ${theme.pulse}` }}
        />
        <span
          aria-hidden="true"
          className="absolute inset-[12%] rounded-full border border-white/5 opacity-70"
        />
        <span
          className="relative inline-flex items-center justify-center rounded-full"
          style={{
            width: size + (isLeader ? 10 : 8),
            height: size + (isLeader ? 10 : 8),
            border: `3px solid ${theme.ring}`,
            boxShadow: theme.glow,
          }}
        >
          <GroupAvatar name={entry.name} color={entry.color} size={size} imageUrl={entry.avatarUrl} />
        </span>
        <span
          className={`absolute -bottom-2.5 z-10 inline-flex min-w-8 items-center justify-center rounded-full px-1.5 py-0.5 font-mono text-lg font-bold leading-none ${theme.badge}`}
        >
          {position}
        </span>
      </div>

      <div className="mt-0.5 max-w-[4.5rem] text-center md:max-w-none">
        <p className={`truncate font-semibold tracking-tight ${isLeader ? "text-base" : "text-xs"}`}>{displayName}</p>
        <p className={`font-mono text-xs font-semibold ${theme.points}`}>
          {entry.pts.toLocaleString("es-AR")} pts
        </p>
      </div>
    </Link>
  )
}
