import Image from "next/image"

import { Trend } from "@/features/home/components/trend"
import type { RankingEntry } from "@/features/rankings/types"

type HomeRankCardProps = {
  you: RankingEntry | undefined
  ptsFallback?: number
}

export function HomeRankCard({ you, ptsFallback = 0 }: HomeRankCardProps) {
  const pts = you?.pts ?? ptsFallback

  return (
    <article className="relative min-h-[168px] overflow-hidden rounded-3xl border border-(--color-border-hi) bg-(--color-card-hi) p-5">
      <div className="flex items-center gap-2">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500/70 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-red-500" />
        </span>
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-red-400">
          Live
        </span>
      </div>

      <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Rank</p>
      <p className="font-mono text-[clamp(2.75rem,8vw,3.5rem)] leading-none font-bold tracking-[-0.04em] text-primary drop-shadow-[0_0_24px_var(--color-lime-mid)]">
        #{you?.rank ?? "–"}
      </p>
      <p className="mt-2 text-sm text-foreground/85">
        {pts} pts · <Trend delta={you?.delta ?? 0} />
      </p>

      <Image
        src="/worl-cup-original.webp"
        alt=""
        width={140}
        height={140}
        aria-hidden
        className="pointer-events-none absolute -right-2 top-1/2 size-32 -translate-y-1/2 object-contain opacity-25 brightness-125 drop-shadow-[0_0_28px_var(--color-lime-mid)] md:size-36"
      />
    </article>
  )
}
