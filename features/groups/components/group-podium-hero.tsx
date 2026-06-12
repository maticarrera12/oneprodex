import type { ReactNode } from "react"
import Image from "next/image"

import { LiveDot } from "@/features/home/components/live-dot"
import { GroupPodiumItem } from "@/features/groups/components/group-podium-item"
import type { RankingEntry } from "@/features/rankings/types"

type GroupPodiumHeroProps = {
  podium: RankingEntry[]
  you?: RankingEntry
  totalMembers: number
}

const PODIUM_SLOTS = {
  second:
    "bottom-[22%] left-[16%] -translate-x-1/2 translate-y-2 md:bottom-[26%] md:left-[32%] md:translate-y-3",
  first: "bottom-[30%] left-1/2 -translate-x-1/2 translate-y-3 md:bottom-[33%] md:translate-y-4",
  third:
    "bottom-[18%] left-[84%] -translate-x-1/2 translate-y-1 md:bottom-[21%] md:left-[68%] md:translate-y-2",
} as const

function HeroStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-background/35 px-3 py-2.5 backdrop-blur-sm">
      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold leading-none text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-[10px] text-(--color-text3)">{hint}</p> : null}
    </div>
  )
}

function PodiumSlot({ className, children }: { className: string; children: ReactNode }) {
  return <div className={`absolute z-10 ${className}`}>{children}</div>
}

export function GroupPodiumHero({ podium, you, totalMembers }: GroupPodiumHeroProps) {
  return (
    <section className="relative min-h-[400px] overflow-hidden rounded-3xl border border-(--color-border-hi) md:min-h-[440px]">
      <Image
        src="/fondo-podio.png"
        alt=""
        fill
        priority
        sizes="(max-width: 768px) 100vw, 1080px"
        className="object-cover object-[center_42%]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-r from-background/78 via-background/52 to-background/28"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-t from-background/62 via-background/15 to-primary/6"
      />

      <p
        aria-hidden="true"
        className="font-display pointer-events-none absolute right-4 bottom-3 text-[clamp(3.5rem,10vw,6rem)] leading-none tracking-[0.04em] text-year-outline md:right-6 md:bottom-5"
      >
        2026
      </p>

      <div className="relative min-h-[400px] md:min-h-[440px]">
        <div className="absolute top-4 left-4 z-20 max-w-[190px] md:top-5 md:left-5 lg:top-6 lg:left-6">
          <p className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
            <LiveDot />
            Live
          </p>
          <h2 className="mt-2 text-[clamp(1.5rem,4vw,2rem)] leading-[0.95] font-extrabold uppercase tracking-[0.02em] text-foreground">
            Ranking
            <br />
            Mundial 2026
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">La competencia está en vivo</p>
        </div>

        {you ? (
          <div className="absolute top-4 right-4 z-20 hidden w-[170px] flex-col gap-2.5 md:flex md:top-5 md:right-5 lg:top-6 lg:right-6">
            <HeroStat label="Posición actual" value={`${you.rank}º / ${totalMembers}`} />
            <HeroStat label="Precisión general" value={`${you.acc}%`} />
            <HeroStat label="Racha" value={`${you.streak} aciertos`} />
          </div>
        ) : null}

        <div className="absolute inset-0">
          <PodiumSlot className={PODIUM_SLOTS.second}>
            <GroupPodiumItem entry={podium[1]} position={2} />
          </PodiumSlot>
          <PodiumSlot className={PODIUM_SLOTS.first}>
            <GroupPodiumItem entry={podium[0]} position={1} isLeader />
          </PodiumSlot>
          <PodiumSlot className={PODIUM_SLOTS.third}>
            <GroupPodiumItem entry={podium[2]} position={3} />
          </PodiumSlot>
        </div>
      </div>
    </section>
  )
}
