"use client"

import { TeamLogo } from "@/features/shared/components/team-logo"
import type { MatchH2HRow } from "@/lib/api-football/types"

type H2HPanelProps = {
  h2h: MatchH2HRow[]
  matchHome: string
  matchAway: string
}

function formatScore(home: number, away: number): string {
  return `${home} - ${away}`
}

function formatDate(kickoff: string): string {
  const date = new Date(kickoff)
  if (Number.isNaN(date.getTime())) return kickoff
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })
}

function formatCompetition(encounter: MatchH2HRow): string | null {
  const parts: string[] = []
  if (encounter.league_name) parts.push(encounter.league_name)
  if (encounter.season) parts.push(String(encounter.season))
  if (encounter.round) parts.push(encounter.round)
  return parts.length > 0 ? parts.join(" · ") : null
}

function computeSummary(h2h: MatchH2HRow[], matchHome: string) {
  let wins = 0
  let draws = 0
  let losses = 0

  for (const encounter of h2h) {
    if (encounter.home_score === null || encounter.away_score === null) continue

    const isHome = encounter.home_team_code === matchHome
    const goalsFor = isHome ? encounter.home_score : encounter.away_score
    const goalsAgainst = isHome ? encounter.away_score : encounter.home_score

    if (goalsFor > goalsAgainst) wins++
    else if (goalsFor === goalsAgainst) draws++
    else losses++
  }

  return { wins, draws, losses }
}

function H2HRow({ encounter }: { encounter: MatchH2HRow }) {
  const competition = formatCompetition(encounter)
  const homeLabel = encounter.home_team_name ?? encounter.home_team_code
  const awayLabel = encounter.away_team_name ?? encounter.away_team_code

  return (
    <div className="px-4 py-3">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex items-center justify-end gap-2 min-w-0">
          <p className="truncate text-sm font-semibold text-right">{homeLabel}</p>
          <TeamLogo code={encounter.home_team_code} logo={encounter.homeLogo} size={20} />
        </div>
        <div className="flex flex-col items-center gap-0.5 shrink-0">
          <span className="font-mono text-sm font-semibold tabular-nums">
            {formatScore(encounter.home_score!, encounter.away_score!)}
          </span>
          <span className="font-mono text-[10px] text-(--color-text3)">
            {formatDate(encounter.kickoff)}
          </span>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <TeamLogo code={encounter.away_team_code} logo={encounter.awayLogo} size={20} />
          <p className="truncate text-sm font-semibold text-left">{awayLabel}</p>
        </div>
      </div>
      {(competition || encounter.venue) && (
        <p className="mt-1.5 text-center font-mono text-[10px] text-(--color-text3)">
          {[competition, encounter.venue].filter(Boolean).join(" · ")}
        </p>
      )}
    </div>
  )
}

export function H2HPanel({ h2h, matchHome, matchAway }: H2HPanelProps) {
  if (h2h.length === 0) {
    return (
      <div className="rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi) p-6 text-center">
        <p className="text-sm text-(--color-text3)">Sin historial disponible</p>
      </div>
    )
  }

  const summary = computeSummary(h2h, matchHome)

  return (
    <div className="rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi) overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-2">
        <p className="font-mono text-[10px] uppercase tracking-wider text-(--color-text3)">
          Historial H2H
        </p>
        <p className="font-mono text-[10px] text-(--color-text3)">
          {matchHome} {summary.wins}G · {summary.draws}E · {summary.losses}P vs {matchAway}
        </p>
      </div>
      <div className="divide-y divide-(--color-border-hi)">
        {h2h.map((encounter) => (
          <H2HRow key={encounter.id} encounter={encounter} />
        ))}
      </div>
    </div>
  )
}

export default H2HPanel
