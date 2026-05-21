import type { RankingEntry } from "@/features/rankings/types"
import { GroupAvatar } from "@/features/groups/components/group-avatar"

type GroupPodiumItemProps = {
  entry: RankingEntry | undefined
  position: 1 | 2 | 3
  isLeader?: boolean
}

export function GroupPodiumItem({ entry, position, isLeader = false }: GroupPodiumItemProps) {
  if (!entry) return null

  const size = isLeader ? 120 : 82
  const ringColor = isLeader ? "var(--color-lime-mid)" : "rgba(148,148,170,0.55)"
  const pointsColor = isLeader ? "text-(--color-primary)" : "text-(--color-amber)"

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative flex items-center justify-center">
        <span
          className="inline-flex items-center justify-center rounded-full"
          style={{
            width: size + (isLeader ? 12 : 8),
            height: size + (isLeader ? 12 : 8),
            border: `3px solid ${ringColor}`,
            boxShadow: isLeader ? "0 0 18px rgba(190,242,100,0.28)" : "none",
          }}
        >
          <GroupAvatar name={entry.name} color={entry.color} size={size} />
        </span>
        <span
          className={`absolute -bottom-3 inline-flex min-w-10 items-center justify-center rounded-full px-2 py-0.5 font-mono text-2xl font-bold leading-none ${
            isLeader
              ? "bg-(--color-primary) text-black"
              : "bg-(--color-card-hi) text-(--color-text2)"
          }`}
        >
          {position}
        </span>
      </div>
      <div className="text-center">
        <p className={`font-semibold tracking-tight ${isLeader ? "text-[22px]" : "text-[17px]"}`}>
          {entry.name.split(" ")[0]} {entry.name.split(" ")[1]?.slice(0, 1)}.
        </p>
        <p className={`font-mono text-md ${pointsColor}`}>{entry.pts.toLocaleString("es-AR")} pts</p>
      </div>
    </div>
  )
}
