import Image from "next/image"

import { LiveDot } from "@/features/home/components/live-dot"
import { GroupPodiumItem } from "@/features/groups/components/group-podium-item"
import type { RankingEntry } from "@/features/rankings/types"

type GroupPodiumHeroProps = {
  podium: RankingEntry[]
  you?: RankingEntry
  totalMembers: number
}

function HeroStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-background/35 px-3 py-2.5 backdrop-blur-sm">
      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold leading-none text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-[10px] text-(--color-text3)">{hint}</p> : null}
    </div>
  )
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
        className="object-cover object-center"
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

      <div className="relative grid min-h-[400px] grid-cols-1 gap-4 p-4 md:min-h-[440px] md:grid-cols-[minmax(0,190px)_1fr_minmax(0,170px)] md:items-end md:gap-3 md:p-5 lg:p-6">
        <div className="z-10 self-start md:self-end md:pb-6">
          <p className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
            <LiveDot />
            Live
          </p>
          <h2 className="mt-2 text-[clamp(1.5rem,4vw,2rem)] leading-[0.95] font-extrabold uppercase tracking-[0.02em] text-foreground">
            Ranking
            <br />
            Mundial 2026
          </h2>
          <p className="mt-2 max-w-[180px] text-xs leading-relaxed text-muted-foreground">
            La competencia está en vivo
          </p>
        </div>

        <div className="z-10 mx-auto grid w-full max-w-lg grid-cols-3 items-end justify-items-center gap-1 pb-2 md:max-w-none md:pb-4">
          <div className="flex w-full justify-center pb-4 md:pb-8">
            <GroupPodiumItem entry={podium[1]} position={2} />
          </div>
          <div className="flex w-full justify-center">
            <GroupPodiumItem entry={podium[0]} position={1} isLeader />
          </div>
          <div className="flex w-full justify-center pb-6 md:pb-10">
            <GroupPodiumItem entry={podium[2]} position={3} />
          </div>
        </div>

        {you ? (
          <div className="z-10 hidden flex-col gap-2.5 md:flex md:pb-6">
            <HeroStat label="Posición actual" value={`${you.rank}º / ${totalMembers}`} />
            <HeroStat label="Precisión general" value={`${you.acc}%`} />
            <HeroStat label="Racha" value={`${you.streak} aciertos`} />
          </div>
        ) : null}
      </div>
    </section>
  )
}
