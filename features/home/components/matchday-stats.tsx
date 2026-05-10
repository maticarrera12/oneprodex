import { Button } from "@/components/ui/button"
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
        <h2 className="text-sm font-semibold uppercase tracking-[0.04em] text-foreground/85">This matchday</h2>
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

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">3 predictions left</p>
          <p className="text-xs text-muted-foreground">Lock by 21:00 today</p>
        </div>
        <Button size="sm">Predict →</Button>
      </div>
    </section>
  )
}
