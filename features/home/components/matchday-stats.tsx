import Link from "next/link"
import { Trend } from "@/features/home/components/trend"

type MatchdayStatsProps = {
  pts: number
  ptsDelta: number
  acc: number
  accDelta: number
  streak: number
  streakDelta: number
}

export function MatchdayStats({ pts, ptsDelta, acc, accDelta, streak, streakDelta }: MatchdayStatsProps) {
  return (
    <section className="rounded-2xl border border-border/80 bg-card/95 p-4">
      <header className="mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.04em] text-foreground/85">Esta jornada</h2>
      </header>

      <div className="grid grid-cols-3 gap-2">
        <article className="rounded-xl border border-border/70 bg-muted/60 p-2.5">
          <p className="text-xs text-muted-foreground">Puntos</p>
          <p className="text-lg font-semibold">{pts}</p>
          <p className="text-xs">
            <Trend delta={ptsDelta} />
          </p>
        </article>

        <article className="rounded-xl border border-border/70 bg-muted/60 p-2.5">
          <p className="text-xs text-muted-foreground">Precision</p>
          <p className="text-lg font-semibold">{acc}%</p>
          <p className="text-xs">
            <Trend delta={accDelta} />
          </p>
        </article>

        <article className="rounded-xl border border-border/70 bg-muted/60 p-2.5">
          <p className="text-xs text-muted-foreground">Racha</p>
          <p className="text-lg font-semibold">{streak}</p>
          <p className="text-xs">
            <Trend delta={streakDelta} />
          </p>
        </article>
      </div>

      <div className="my-3 h-px bg-border" />

      <Link
        href="/partidos"
        className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
      >
        Predecí los partidos →
      </Link>
    </section>
  )
}
