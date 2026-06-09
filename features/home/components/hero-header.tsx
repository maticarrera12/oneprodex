import Image from "next/image"
import Link from "next/link"

import { Trend } from "@/features/home/components/trend"
import type { RankingEntry } from "@/features/rankings/types"

type HeroHeaderProps = {
  matchday: string
  you: RankingEntry | undefined
}

export function HeroHeader({ matchday, you }: HeroHeaderProps) {
  return (
    <section
      className="-mx-4 mb-4 px-5 py-4"
      style={{ background: "radial-gradient(120% 110% at 0% 0%, rgba(132,204,22,0.17) 0%, color-mix(in oklch, var(--background) 0%, transparent) 62%)" }}
    >
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/oneprodex_fondo.png"
            alt="OneProdex"
            width={44}
            height={44}
            className="rounded-xl shadow-[0_6px_18px_rgba(190,242,100,0.35)]"
          />
          <div>
            <p className="text-sm font-semibold text-foreground">Sunday</p>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">{matchday}</p>
          </div>
        </div>

        <span className="inline-flex h-9 items-center rounded-xl border border-border/80 bg-card/85 px-3 text-xs text-muted-foreground">
          Live
        </span>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-[2rem] leading-[1.02] font-bold tracking-[-0.03em]">Your World Cup, live.</h1>
        </div>

        <Link
          href="/grupo"
          className="inline-flex flex-col rounded-xl border border-border/80 bg-card/90 px-3 py-2 text-right"
        >
          <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-muted-foreground">Rank</span>
          <span className="font-mono text-xl leading-none font-semibold text-primary">#{you?.rank ?? "-"}</span>
          <span className="text-xs text-foreground/80">{you?.pts ?? 0} pts ·{" "}
            <Trend delta={you?.delta ?? 0} />
          </span>
        </Link>
      </div>
    </section>
  )
}
