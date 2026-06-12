"use client"

import type { MatchH2HRow } from "@/lib/api-football/types"

type H2HPanelProps = {
  h2h: MatchH2HRow[]
}

function formatScore(home: number | null, away: number | null): string {
  if (home === null || away === null) return "- - -"
  return `${home} - ${away}`
}

function formatDate(kickoff: string): string {
  const date = new Date(kickoff)
  if (Number.isNaN(date.getTime())) return kickoff
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })
}

function H2HRow({ encounter }: { encounter: MatchH2HRow }) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3">
      <p className="text-sm font-semibold text-right">{encounter.home_team_code}</p>
      <div className="flex flex-col items-center gap-0.5">
        <span className="font-mono text-sm font-semibold tabular-nums">
          {formatScore(encounter.home_score, encounter.away_score)}
        </span>
        <span className="font-mono text-[10px] text-(--color-text3)">
          {formatDate(encounter.kickoff)}
        </span>
      </div>
      <p className="text-sm font-semibold text-left">{encounter.away_team_code}</p>
    </div>
  )
}

export function H2HPanel({ h2h }: H2HPanelProps) {
  if (h2h.length === 0) {
    return (
      <div className="rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi) p-6 text-center">
        <p className="text-sm text-(--color-text3)">Sin historial disponible</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi) overflow-hidden">
      <p className="px-4 pt-4 pb-1 font-mono text-[10px] uppercase tracking-wider text-(--color-text3)">
        Historial H2H
      </p>
      <div className="divide-y divide-(--color-border-hi)">
        {h2h.map((encounter) => (
          <H2HRow key={encounter.id} encounter={encounter} />
        ))}
      </div>
    </div>
  )
}

export default H2HPanel
