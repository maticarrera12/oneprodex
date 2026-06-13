"use client"

import type { OutcomeSplit } from "@/features/predictions/utils/consensus"

type OutcomeDonutChartProps = {
  homeCode: string
  awayCode: string
  split: OutcomeSplit
}

const SEGMENTS = [
  { key: "home", color: "var(--color-primary)" },
  { key: "draw", color: "rgba(148,163,184,0.55)" },
  { key: "away", color: "var(--color-blue)" },
] as const

const DONUT_RADIUS = 15.915

function arcPct(count: number, total: number): number {
  if (total === 0 || count === 0) return 0
  return (count / total) * 100
}

function leaderFromSplit(split: OutcomeSplit, homeCode: string, awayCode: string) {
  const { homePct, drawPct, awayPct } = split
  if (homePct >= drawPct && homePct >= awayPct) return { label: homeCode, pct: homePct }
  if (awayPct >= drawPct) return { label: awayCode, pct: awayPct }
  return { label: "Empate", pct: drawPct }
}

export function OutcomeDonutChart({ homeCode, awayCode, split }: OutcomeDonutChartProps) {
  const total = split.homeCount + split.drawCount + split.awayCount
  const leader = leaderFromSplit(split, homeCode, awayCode)

  const arcs = [
    { key: "home" as const, label: homeCode, count: split.homeCount, pct: split.homePct, color: SEGMENTS[0].color },
    { key: "draw" as const, label: "Empate", count: split.drawCount, pct: split.drawPct, color: SEGMENTS[1].color },
    { key: "away" as const, label: awayCode, count: split.awayCount, pct: split.awayPct, color: SEGMENTS[2].color },
  ]

  const visibleArcs = arcs.filter((arc) => arc.count > 0)
  let cumulative = 0

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative size-28 shrink-0">
        <svg viewBox="0 0 36 36" className="size-full -rotate-90" aria-hidden>
          <circle
            cx="18"
            cy="18"
            r={DONUT_RADIUS}
            fill="none"
            stroke="var(--color-bg2)"
            strokeWidth="3.4"
          />
          {visibleArcs.map((arc) => {
            const slice = arcPct(arc.count, total)
            const dashOffset = -cumulative
            cumulative += slice

            return (
              <circle
                key={arc.key}
                cx="18"
                cy="18"
                r={DONUT_RADIUS}
                fill="none"
                stroke={arc.color}
                strokeWidth="3.4"
                strokeDasharray={`${slice} ${100 - slice}`}
                strokeDashoffset={dashOffset}
                pathLength="100"
              />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="font-mono text-lg font-semibold leading-none text-foreground">{leader.pct}%</p>
          <p className="mt-1 max-w-[4.5rem] truncate text-[9px] text-(--color-text3)">{leader.label}</p>
        </div>
      </div>

      <ul className="grid w-full grid-cols-3 gap-1 sm:gap-2">
        {arcs.map((arc) => (
          <li key={arc.key} className="flex min-w-0 flex-col items-center gap-0.5 text-center sm:gap-1">
            <span className="flex max-w-full items-center justify-center gap-1">
              <span className="size-1.5 shrink-0 rounded-full sm:size-2" style={{ backgroundColor: arc.color }} />
              <span className="truncate font-mono text-[9px] text-(--color-text3) sm:text-[10px]">{arc.label}</span>
            </span>
            <span className="text-xs font-semibold text-foreground sm:text-sm">{arc.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
