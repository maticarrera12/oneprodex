import { LiveDot } from "@/features/home/components/live-dot"
import type { RankingEntry } from "@/features/rankings/types"
import { GroupPodiumItem } from "@/features/groups/components/group-podium-item"

type GroupPodiumHeroProps = {
  podium: RankingEntry[]
}

export function GroupPodiumHero({ podium }: GroupPodiumHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-[22px] bg-linear-to-b from-black/35 to-transparent px-2 pt-2 pb-4">
      <span className="pointer-events-none absolute -top-10 left-1/2 size-64 -translate-x-1/2 rounded-full bg-(--color-lime-mid) opacity-10 blur-3xl" />
      <p className="inline-flex w-full items-center justify-center gap-2 font-mono text-[10px] tracking-wider text-(--color-primary) uppercase">
        <LiveDot />
        Live ranking
      </p>
      <div className="mx-auto mt-2 grid w-full max-w-md grid-cols-3 items-end justify-items-center gap-1">
        <div className="flex w-full justify-center">
          <GroupPodiumItem entry={podium[1]} position={2} />
        </div>
        <div className="flex w-full justify-center">
          <GroupPodiumItem entry={podium[0]} position={1} isLeader />
        </div>
        <div className="flex w-full justify-center">
          <GroupPodiumItem entry={podium[2]} position={3} />
        </div>
      </div>
    </section>
  )
}
