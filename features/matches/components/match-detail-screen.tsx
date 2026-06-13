"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

import { Flag } from "@/features/home/components/flag"
import { GroupAvatar } from "@/features/groups/components/group-avatar"
import { LineupsPanel } from "@/features/matches/components/lineups-panel"
import { canPickScorerForTeam, derivePredictionFlow } from "@/features/matches/utils/prediction-flow"
import { formatKickoffHero } from "@/features/matches/utils/kickoff"
import type { Match } from "@/features/matches/types"
import { OutcomeDonutChart } from "@/features/predictions/components/outcome-donut-chart"
import { CleanSheetToggle } from "@/features/predictions/components/clean-sheet-toggle"
import { PointsBreakdown } from "@/features/predictions/components/points-breakdown"
import { ScorePrediction } from "@/features/predictions/components/score-prediction"
import type { MatchConsensusGroup } from "@/features/predictions/api"
import { usePrediction } from "@/features/predictions/hooks/usePrediction"
import type { MatchEvent, MatchPredictionState, PlayerDetail } from "@/features/predictions/types"
import { MAX_RED_CARDS, MAX_SCORERS, MAX_YELLOW_CARDS } from "@/features/predictions/types"
import {
  computeOutcomeSplit,
  computeScoreDistribution,
  type OutcomeFilter,
} from "@/features/predictions/utils/consensus"
import { MATCH_SCORING, MATCH_SCORING_LABELS } from "@/features/scoring/constants"
import { userAccentColor } from "@/features/shared/utils/user-accent-color"
import type { MatchLineupRow } from "@/lib/api-football/types"

const EMPTY_LINEUPS: { home: MatchLineupRow[]; away: MatchLineupRow[] } = { home: [], away: [] }

type MatchDetailScreenProps = {
  match: Match
  predictionState: MatchPredictionState
  players: { home: PlayerDetail[]; away: PlayerDetail[] }
  events: MatchEvent[]
  consensusGroups: MatchConsensusGroup[]
  lineups?: { home: MatchLineupRow[]; away: MatchLineupRow[] }
  playersMap?: Map<number, string>
}

export function MatchDetailScreen({
  match,
  predictionState,
  players,
  events,
  consensusGroups,
  lineups = EMPTY_LINEUPS,
  playersMap = new Map(),
}: MatchDetailScreenProps) {
  const router = useRouter()
  const isLive = match.status === "LIVE"
  const isFinished = match.status === "FINISHED"
  const isUpcoming = match.status === "UPCOMING"
  const editLocked = predictionState.editLocked
  const predictionFlow = derivePredictionFlow({
    matchStatus: match.status,
    hasScore: Boolean(predictionState.score),
    editLocked,
  })
  const kickoff = formatKickoffHero(match.kickoff)
  const [selectedGroupId, setSelectedGroupId] = useState(consensusGroups[0]?.id ?? "")
  const [mobileMainPanel, setMobileMainPanel] = useState<"prediction" | "status" | "consensus">("prediction")

  const { optimistic, toggleScorer, toggleYellowCard, toggleRedCard, toggleCleanSheet, handleScoreSubmit, handleExtrasSubmit } =
    usePrediction(
      predictionState,
      match.id,
      predictionFlow.scoreLocked,
      predictionFlow.extrasLocked,
      match.home,
      match.away,
    )

  const [extrasSaving, setExtrasSaving] = useState(false)
  const [extrasError, setExtrasError] = useState<string | null>(null)
  const hasSavedOrOptimisticScore = Boolean(optimistic.score)
  const scoreLocked = predictionFlow.scoreLocked || hasSavedOrOptimisticScore

  const persistedHome = optimistic.score?.home_score ?? match.pred?.hs ?? 0
  const persistedAway = optimistic.score?.away_score ?? match.pred?.as ?? 0
  const [draftScore, setDraftScore] = useState({ home: persistedHome, away: persistedAway })

  useEffect(() => {
    setDraftScore({ home: persistedHome, away: persistedAway })
  }, [match.id, persistedHome, persistedAway])

  useEffect(() => {
    setSelectedGroupId(consensusGroups[0]?.id ?? "")
  }, [consensusGroups])

  const selectedGroup = consensusGroups.find((group) => group.id === selectedGroupId) ?? consensusGroups[0]
  const consensusPredictions = selectedGroup?.predictions ?? []
  const outcomeSplit = useMemo(() => computeOutcomeSplit(consensusPredictions), [consensusPredictions])
  const scoreDistribution = useMemo(() => computeScoreDistribution(consensusPredictions), [consensusPredictions])

  const cleanSheetCodes = useMemo(() => {
    const next: string[] = []
    if (draftScore.away === 0) next.push(match.home)
    if (draftScore.home === 0) next.push(match.away)
    return next
  }, [draftScore.away, draftScore.home, match.away, match.home])

  async function saveExtras() {
    setExtrasSaving(true)
    setExtrasError(null)
    const result = await handleExtrasSubmit(draftScore.home, draftScore.away)
    setExtrasSaving(false)

    if (result.error) {
      setExtrasError(
        result.error === "already_locked" ? "Estos detalles ya fueron guardados." : "No se pudieron guardar los detalles.",
      )
      return
    }

    router.refresh()
  }

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden pt-3 pb-28 sm:space-y-5 sm:pt-4">
      <MatchHero
        match={match}
        isLive={isLive}
        isFinished={isFinished}
        kickoff={kickoff}
        groupStats={
          selectedGroup && selectedGroup.summary.count > 0
            ? {
                count: selectedGroup.summary.count,
                topScore: selectedGroup.summary.topScore,
                outcomeSplit,
                homeCode: match.home,
                awayCode: match.away,
              }
            : null
        }
      />

      <div className="space-y-3 lg:space-y-0">
        <div className="flex gap-2 lg:hidden">
          <MainPanelTab
            label="Marcador"
            active={mobileMainPanel === "prediction"}
            onClick={() => setMobileMainPanel("prediction")}
          />
          <MainPanelTab
            label="Estado"
            active={mobileMainPanel === "status"}
            onClick={() => setMobileMainPanel("status")}
          />
          <MainPanelTab
            label="Grupo"
            active={mobileMainPanel === "consensus"}
            onClick={() => setMobileMainPanel("consensus")}
          />
        </div>

        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,1fr)]">
          <section
            className={`min-w-0 rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi) shadow-[0_10px_30px_rgba(0,0,0,0.2)] ${
              mobileMainPanel !== "prediction" ? "hidden lg:block" : ""
            }`}
          >
          <ScorePrediction
            matchId={match.id}
            homeTeamCode={match.home}
            awayTeamCode={match.away}
            homeScore={draftScore.home}
            awayScore={draftScore.away}
            onChange={(home, away) => setDraftScore({ home, away })}
            isLocked={scoreLocked}
            onSubmit={handleScoreSubmit}
            showSubmit={false}
          />
          <PotentialPointsPanel />
          <div className="border-t border-(--color-border-hi) lg:hidden">
            <CleanSheetToggle
              matchId={match.id}
              homeTeamCode={match.home}
              awayTeamCode={match.away}
              homeGoalsPredicted={draftScore.home}
              awayGoalsPredicted={draftScore.away}
              selectedCodes={cleanSheetCodes}
              onToggle={toggleCleanSheet}
              isLocked={scoreLocked}
            />
          </div>
        </section>

        <section
          className={`min-w-0 space-y-4 ${mobileMainPanel !== "status" ? "hidden lg:block" : ""}`}
        >
          <MatchStatusCard
            match={match}
            draftScore={draftScore}
            scoreLocked={scoreLocked}
            extrasLocked={predictionFlow.extrasLocked}
            extrasVisible={predictionFlow.extrasVisible}
            isUpcoming={isUpcoming}
            isLive={isLive}
            isFinished={isFinished}
            kickoff={match.kickoff}
          />
          <div className="hidden lg:block">
            <CleanSheetToggle
              matchId={match.id}
              homeTeamCode={match.home}
              awayTeamCode={match.away}
              homeGoalsPredicted={draftScore.home}
              awayGoalsPredicted={draftScore.away}
              selectedCodes={cleanSheetCodes}
              onToggle={toggleCleanSheet}
              isLocked={scoreLocked}
            />
          </div>
        </section>

        <div className={`min-w-0 ${mobileMainPanel !== "consensus" ? "hidden lg:block" : ""}`}>
          <ConsensusSidebar
          groups={consensusGroups}
          selectedGroupId={selectedGroup?.id ?? ""}
          onSelectGroup={setSelectedGroupId}
          homeCode={match.home}
          awayCode={match.away}
          outcomeSplit={outcomeSplit}
          scoreDistribution={scoreDistribution}
          summary={selectedGroup?.summary ?? { count: 0, topScore: null, topScoreCount: 0 }}
        />
        </div>
      </div>
      </div>

      {predictionFlow.extrasVisible ? (
        <PlayerExtrasSection
          match={match}
          players={players}
          draftScore={draftScore}
          optimistic={optimistic}
          extrasLocked={predictionFlow.extrasLocked}
          extrasSaving={extrasSaving}
          extrasError={extrasError}
          onSave={saveExtras}
          onScorer={toggleScorer}
          onYellow={toggleYellowCard}
          onRed={toggleRedCard}
        />
      ) : null}

      <LineupsPanel
        lineups={lineups}
        playersMap={playersMap}
        homeCode={match.home}
        awayCode={match.away}
        homeLogo={match.homeLogo}
        awayLogo={match.awayLogo}
      />

      <PlayerPredictionsGrid
        groups={consensusGroups}
        selectedGroupId={selectedGroup?.id ?? ""}
        onSelectGroup={setSelectedGroupId}
        homeCode={match.home}
        awayCode={match.away}
      />

      {isFinished ? (
        <PointsBreakdown
          prediction={optimistic.score}
          match={{ hs: match.hs, as: match.as, home: match.home, away: match.away }}
          scorerIds={optimistic.scorerIds}
          yellowCardIds={optimistic.yellowCardIds}
          redCardIds={optimistic.redCardIds}
          cleanSheetCodes={cleanSheetCodes}
          events={events}
        />
      ) : null}
    </div>
  )
}

function MatchHero({
  match,
  isLive,
  isFinished,
  kickoff,
  groupStats,
}: {
  match: Match
  isLive: boolean
  isFinished: boolean
  kickoff: string
  groupStats: {
    count: number
    topScore: string | null
    outcomeSplit: ReturnType<typeof computeOutcomeSplit>
    homeCode: string
    awayCode: string
  } | null
}) {
  const homeGlow = match.homeC1 ? `${match.homeC1}33` : "rgba(59,130,246,0.22)"
  const awayGlow = match.awayC1 ? `${match.awayC1}33` : "rgba(239,68,68,0.22)"
  const stageLabel = match.stage.replace(/\s*-\s*/g, " • ").toUpperCase()
  const showScore = isLive || isFinished

  return (
    <section className="relative overflow-hidden rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi) shadow-[0_16px_48px_rgba(0,0,0,0.28)]">
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle at 0% 50%, ${homeGlow} 0%, transparent 55%), radial-gradient(circle at 100% 50%, ${awayGlow} 0%, transparent 55%)`,
        }}
      />

      <div className="relative px-3 pt-3 pb-4 sm:px-4 sm:pt-4 sm:pb-5 md:px-6 md:pt-5">
        <div className="mb-3 flex items-center justify-between">
          <Link
            href="/partidos"
            className="inline-flex size-10 items-center justify-center rounded-xl border border-(--color-border-hi) bg-(--color-bg2)/80 backdrop-blur-sm"
            aria-label="Volver a partidos"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
              <path
                d="M10 3 5 8l5 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-xl border border-(--color-border-hi) bg-(--color-bg2)/80 backdrop-blur-sm text-(--color-text3)"
            aria-hidden
            tabIndex={-1}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2 4 6v6c0 5 3.5 9.5 8 10 4.5-.5 8-5 8-10V6l-8-4Z" />
            </svg>
          </button>
        </div>

        <p className="mb-4 text-center font-mono text-[11px] font-medium tracking-[0.12em] text-(--color-primary) uppercase">
          {stageLabel}
        </p>

        <div className="mx-auto flex max-w-md flex-col items-center">
          {isLive ? (
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-(--color-lime-deep)/50 bg-black/45 px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-(--color-primary) uppercase">
              <span className="size-1.5 shrink-0 rounded-full bg-(--color-primary) shadow-[0_0_6px_var(--color-primary)]" />
              Live
              {match.minute != null ? ` · ${match.minute}'` : ""}
            </span>
          ) : isFinished ? (
            <span className="mb-2 rounded-full border border-(--color-border-hi) bg-black/30 px-2.5 py-0.5 font-mono text-[10px] tracking-wide text-(--color-text2) uppercase">
              Final
            </span>
          ) : null}

          <div className="inline-grid grid-cols-[auto_auto_auto] items-center gap-x-2.5 gap-y-1.5 sm:gap-x-3.5">
            <HeroSideFlag code={match.home} logo={match.homeLogo} className="col-start-1 row-start-1" />

            <div className="col-start-2 row-start-1 px-0.5 text-center">
              {showScore ? (
                <p className="font-mono text-[1.65rem] leading-none font-semibold tracking-tight text-foreground sm:text-[2rem] md:text-[2.35rem]">
                  {match.hs ?? 0}
                  <span className="mx-1.5 font-normal text-(--color-text4)">-</span>
                  {match.as ?? 0}
                </p>
              ) : (
                <p className="font-mono text-xl font-semibold tracking-wider text-(--color-text3)">VS</p>
              )}
            </div>

            <HeroSideFlag code={match.away} logo={match.awayLogo} className="col-start-3 row-start-1" />

            <p className="col-start-1 row-start-2 justify-self-center font-mono text-sm font-bold tracking-wide text-foreground">
              {match.home}
            </p>
            <p className="col-start-3 row-start-2 justify-self-center font-mono text-sm font-bold tracking-wide text-foreground">
              {match.away}
            </p>
          </div>

          <div className="mt-2.5 flex flex-col items-center gap-1 text-center">
            <p className="text-xs text-(--color-text2)">{kickoff}</p>
            {match.venue ? (
              <p className="flex max-w-64 items-center justify-center gap-1.5 text-[11px] text-(--color-text3)">
                <StadiumIcon />
                <span className="truncate">{match.venue}</span>
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {groupStats ? <HeroStatsBar {...groupStats} /> : null}
    </section>
  )
}

function HeroSideFlag({ code, logo, className }: { code: string; logo?: string | null; className?: string }) {
  const size = 52

  return (
    <div className={className}>
      {logo ? (
        <img
          src={logo}
          alt={code}
          className="size-[52px] rounded-full border border-white/20 object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.25)]"
        />
      ) : (
        <Flag code={code} size={size} />
      )}
    </div>
  )
}

function StadiumIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="shrink-0 text-(--color-text3)"
      aria-hidden
    >
      <path d="M3 11c0-3 4-5 9-5s9 2 9 5" strokeLinecap="round" />
      <path d="M3 11v2c0 3 4 5 9 5s9-2 9-5v-2" strokeLinecap="round" />
      <path d="M7 13h10M9 16h6" strokeLinecap="round" />
      <path d="M12 11V8" strokeLinecap="round" />
    </svg>
  )
}

function HeroStatsBar({
  count,
  topScore,
  outcomeSplit,
  homeCode,
  awayCode,
}: {
  count: number
  topScore: string | null
  outcomeSplit: ReturnType<typeof computeOutcomeSplit>
  homeCode: string
  awayCode: string
}) {
  const leaderPct = Math.max(outcomeSplit.homePct, outcomeSplit.drawPct, outcomeSplit.awayPct)
  const leaderCode =
    outcomeSplit.homePct >= outcomeSplit.drawPct && outcomeSplit.homePct >= outcomeSplit.awayPct
      ? homeCode
      : outcomeSplit.awayPct >= outcomeSplit.drawPct
        ? awayCode
        : null
  const leaderLabel = leaderCode ? `Elige ${leaderCode} para ganar` : "Elige empate para ganar"

  return (
    <div className="relative grid grid-cols-3 divide-x divide-(--color-border-hi) border-t border-(--color-border-hi) bg-black/25 backdrop-blur-sm">
      <HeroStatColumn
        icon="users"
        value={`${count}`}
        label="realizando predicción"
        shortLabel="predicciones"
      />
      <HeroStatColumn icon="chart" value={`${leaderPct}%`} label={leaderLabel} shortLabel="favorito" />
      <HeroStatColumn icon="flame" value={topScore ?? "–"} label="Marcador más elegido" shortLabel="top score" />
    </div>
  )
}

function HeroStatColumn({
  icon,
  value,
  label,
  shortLabel,
}: {
  icon: "users" | "chart" | "flame"
  value: string
  label: string
  shortLabel: string
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-0.5 px-1 py-3 text-center sm:gap-1 sm:px-2 sm:py-3.5 md:px-3 md:py-4">
      <div className="flex items-center justify-center gap-1 sm:gap-1.5">
        <HeroStatIcon type={icon} />
        <p className="font-mono text-lg font-semibold leading-none text-foreground sm:text-xl md:text-2xl">{value}</p>
      </div>
      <p className="max-w-full truncate text-[9px] leading-snug text-(--color-text3) sm:hidden">{shortLabel}</p>
      <p className="hidden max-w-full text-[10px] leading-snug text-(--color-text3) sm:block md:text-[11px]">{label}</p>
    </div>
  )
}

function MainPanelTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center rounded-xl border px-2 py-2.5 text-xs font-semibold transition sm:text-sm ${
        active
          ? "border-primary/45 bg-primary/15 text-primary shadow-[0_0_20px_rgba(163,230,53,0.12)]"
          : "border-(--color-border-hi) bg-(--color-card-hi) text-(--color-text2)"
      }`}
    >
      {label}
    </button>
  )
}

function HeroStatIcon({ type }: { type: "users" | "chart" | "flame" }) {
  const className = "shrink-0 text-(--color-text3)"

  if (type === "users") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )
  }

  if (type === "chart") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden>
        <path d="M3 3v18h18" />
        <path d="M7 16V9M12 16V5M17 16v-3" />
      </svg>
    )
  }

  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5Z" />
    </svg>
  )
}

function PotentialPointsPanel() {
  const rows = [
    { label: "Resultado exacto", pts: MATCH_SCORING.exactScore, accent: "text-primary" },
    { label: "Solo resultado", pts: MATCH_SCORING.correctResult, accent: "text-(--color-text2)" },
    { label: `Goleador (máx. ${MAX_SCORERS})`, pts: MATCH_SCORING.scorer, accent: "text-primary", suffix: " c/u" },
    { label: `Tarjeta amarilla (máx. ${MAX_YELLOW_CARDS})`, pts: MATCH_SCORING.yellowCard, accent: "text-amber-400", suffix: " c/u" },
    { label: `Tarjeta roja (máx. ${MAX_RED_CARDS})`, pts: MATCH_SCORING.redCard, accent: "text-red-400", suffix: " c/u" },
    { label: "Arco en 0", pts: MATCH_SCORING.cleanSheet, accent: "text-(--color-blue)" },
  ] as const

  const maxTheoretical =
    MATCH_SCORING.exactScore +
    MATCH_SCORING.scorer * MAX_SCORERS +
    MATCH_SCORING.yellowCard * MAX_YELLOW_CARDS +
    MATCH_SCORING.redCard * MAX_RED_CARDS +
    MATCH_SCORING.cleanSheet * 2

  return (
    <div className="border-t border-(--color-border-hi) px-4 pb-4 pt-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-wider text-(--color-text3)">Puntos potenciales</p>
        <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary">
          hasta +{maxTheoretical}
        </span>
      </div>
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between gap-3 text-xs">
            <span className="text-(--color-text2)">{row.label}</span>
            <span className={`font-mono font-semibold tabular-nums ${row.accent}`}>
              +{row.pts}
              {"suffix" in row ? row.suffix : ""} pts
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] leading-relaxed text-(--color-text3)">
        El marcador suma una sola categoría (exacto o resultado). Guardá los extras antes del kickoff.
      </p>
    </div>
  )
}

function MatchStatusCard({
  match,
  draftScore,
  scoreLocked,
  extrasLocked,
  extrasVisible,
  isUpcoming,
  isLive,
  isFinished,
  kickoff,
}: {
  match: Match
  draftScore: { home: number; away: number }
  scoreLocked: boolean
  extrasLocked: boolean
  extrasVisible: boolean
  isUpcoming: boolean
  isLive: boolean
  isFinished: boolean
  kickoff: string
}) {
  const hasDraft = draftScore.home > 0 || draftScore.away > 0 || scoreLocked

  return (
    <div className="overflow-hidden rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi) shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
      <div className="flex items-center justify-between border-b border-(--color-border-hi) px-4 py-3">
        <p className="font-mono text-[10px] uppercase tracking-wider text-(--color-text3)">Tu estado</p>
        <span
          className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${
            scoreLocked
              ? "border-primary/40 bg-primary/15 text-primary"
              : isLive || isFinished
                ? "border-(--color-border-hi) bg-(--color-bg2) text-(--color-text3)"
                : "border-amber-400/40 bg-amber-400/10 text-amber-300"
          }`}
        >
          {scoreLocked ? "Bloqueada" : isLive ? "En juego" : isFinished ? "Cerrada" : "Abierta"}
        </span>
      </div>

      {hasDraft ? (
        <div className="flex items-center justify-center gap-3 border-b border-(--color-border-hi) bg-[linear-gradient(180deg,rgba(132,204,22,0.08)_0%,transparent_100%)] px-4 py-4">
          <MiniTeamBadge code={match.home} logo={match.homeLogo} />
          <p className="font-mono text-3xl font-semibold tracking-tight text-primary">
            {draftScore.home}-{draftScore.away}
          </p>
          <MiniTeamBadge code={match.away} logo={match.awayLogo} />
        </div>
      ) : null}

      <div className="space-y-3 p-4">
        <div className="flex items-start gap-3">
          <span
            className={`inline-flex size-10 shrink-0 items-center justify-center rounded-xl border text-lg ${
              scoreLocked
                ? "border-primary/35 bg-primary/10"
                : "border-amber-400/35 bg-amber-400/10"
            }`}
          >
            {scoreLocked ? "🔒" : "✏️"}
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {scoreLocked ? "Marcador guardado" : "Marcador sin guardar"}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-(--color-text3)">
              {isUpcoming
                ? scoreLocked
                  ? "Podés seguir editando goles/tarjetas hasta el kickoff, salvo que ya hayas cerrado los extras."
                  : "Elegí un marcador con los steppers o los accesos rápidos y guardá desde abajo."
                : isLive
                  ? "El partido ya empezó. Tu predicción quedó congelada al inicio."
                  : "Partido finalizado. Revisá el desglose de puntos más abajo."}
            </p>
          </div>
        </div>

        {isUpcoming ? (
          <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-center">
            <p className="font-mono text-[10px] uppercase tracking-wider text-primary/80">Cierra en</p>
            <KickoffCountdown kickoff={kickoff} variant="panel" />
            <p className="mt-1 text-[11px] text-(--color-text3)">Al arrancar el partido no se puede cambiar nada.</p>
          </div>
        ) : null}

        {extrasVisible ? (
          <div className="rounded-xl border border-(--color-border-hi) bg-(--color-bg2) px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-(--color-text2)">Extras (G / A / R)</p>
              <span
                className={`font-mono text-[10px] font-semibold uppercase ${
                  extrasLocked ? "text-primary" : "text-amber-300"
                }`}
              >
                {extrasLocked ? "Guardados" : "Pendientes"}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-(--color-text3)">
              {extrasLocked
                ? "Tus goleadores y tarjetas ya quedaron registrados."
                : "Completá goleadores y tarjetas y tocá Guardar predicción."}
            </p>
          </div>
        ) : null}

        {isUpcoming && !scoreLocked ? (
          <p className="text-center text-[11px] text-(--color-text3)">{MATCH_SCORING_LABELS.prodeHint}</p>
        ) : null}
      </div>
    </div>
  )
}

function MiniTeamBadge({ code, logo }: { code: string; logo?: string | null }) {
  if (logo) {
    return (
      <img src={logo} alt={code} className="size-8 rounded-full border border-white/20 object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.2)]" />
    )
  }
  return <Flag code={code} size={32} />
}

function ConsensusSidebar({
  groups,
  selectedGroupId,
  onSelectGroup,
  homeCode,
  awayCode,
  outcomeSplit,
  scoreDistribution,
  summary,
}: {
  groups: MatchConsensusGroup[]
  selectedGroupId: string
  onSelectGroup: (id: string) => void
  homeCode: string
  awayCode: string
  outcomeSplit: ReturnType<typeof computeOutcomeSplit>
  scoreDistribution: ReturnType<typeof computeScoreDistribution>
  summary: MatchConsensusGroup["summary"]
}) {
  return (
    <section className="rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi) p-4 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-wider text-(--color-text3)">Consenso del grupo</p>
        {groups.length === 1 ? <p className="truncate font-mono text-[10px] text-primary">{groups[0]?.name}</p> : null}
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-(--color-text3)">Unite a un grupo para ver el consenso del partido.</p>
      ) : (
        <div className="space-y-4">
          {groups.length > 1 ? (
            <div className="scrollbar-none flex gap-2 overflow-x-auto">
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => onSelectGroup(group.id)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    group.id === selectedGroupId
                      ? "border-primary/45 bg-primary/15 text-primary"
                      : "border-(--color-border-hi) bg-(--color-bg2) text-(--color-text2)"
                  }`}
                >
                  {group.name}
                </button>
              ))}
            </div>
          ) : null}

          {summary.count === 0 ? (
            <p className="text-sm text-(--color-text3)">Todavía no hay predicciones en este grupo.</p>
          ) : (
            <>
              <div className="space-y-2">
                {scoreDistribution.map((entry) => (
                  <div key={entry.score}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-mono font-semibold">{entry.score}</span>
                      <span className="text-(--color-text3)">{entry.pct}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-(--color-bg2)">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-primary/90 to-[rgba(132,204,22,0.55)]"
                        style={{ width: `${entry.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-(--color-border-hi) bg-(--color-bg2) p-3">
                <p className="font-mono text-[10px] uppercase tracking-wider text-(--color-text3)">Sentimiento</p>
                <div className="mt-3">
                  <OutcomeDonutChart homeCode={homeCode} awayCode={awayCode} split={outcomeSplit} />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  )
}

function PlayerPredictionsGrid({
  groups,
  selectedGroupId,
  onSelectGroup,
  homeCode,
  awayCode,
}: {
  groups: MatchConsensusGroup[]
  selectedGroupId: string
  onSelectGroup: (id: string) => void
  homeCode: string
  awayCode: string
}) {
  const [filter, setFilter] = useState<OutcomeFilter>("all")
  const selectedGroup = groups.find((group) => group.id === selectedGroupId) ?? groups[0]
  const filtered = useMemo(() => {
    if (!selectedGroup) return []
    if (filter === "all") return selectedGroup.predictions
    if (filter === "home") return selectedGroup.predictions.filter((p) => p.homeScore > p.awayScore)
    if (filter === "draw") return selectedGroup.predictions.filter((p) => p.homeScore === p.awayScore)
    return selectedGroup.predictions.filter((p) => p.homeScore < p.awayScore)
  }, [filter, selectedGroup])

  if (groups.length === 0) return null

  return (
    <section>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider text-(--color-text2) uppercase">Predicciones del grupo</p>
          <p className="font-mono text-[10px] text-(--color-text3)">{filtered.length} visibles</p>
        </div>
        {groups.length > 1 ? (
          <select
            value={selectedGroupId}
            onChange={(event) => onSelectGroup(event.target.value)}
            className="w-full rounded-lg border border-(--color-border-hi) bg-(--color-card-hi) px-2 py-1.5 text-xs sm:w-auto"
          >
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      <div className="scrollbar-none mb-3 flex gap-2 overflow-x-auto pb-0.5">
        {(
          [
            ["all", "Todos"],
            ["home", homeCode],
            ["draw", "Empate"],
            ["away", awayCode],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition ${
              filter === value
                ? "border-primary/45 bg-primary/15 text-primary"
                : "border-(--color-border-hi) bg-(--color-card-hi) text-(--color-text3)"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi) p-6 text-center">
          <p className="text-sm text-(--color-text3)">No hay predicciones para este filtro.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
          {filtered.map((prediction) => (
            <div
              key={prediction.userId}
              className={`relative min-w-0 overflow-hidden rounded-2xl border p-3 shadow-[0_10px_28px_rgba(0,0,0,0.18)] sm:p-4 ${
                prediction.isYou
                  ? "border-primary/45 bg-[linear-gradient(180deg,rgba(132,204,22,0.12)_0%,rgba(15,23,42,0.2)_100%)]"
                  : "border-(--color-border-hi) bg-(--color-card-hi)"
              }`}
            >
              <div className="flex flex-col items-center gap-2 text-center sm:gap-3">
                <GroupAvatar
                  name={prediction.displayName}
                  color={userAccentColor(prediction.handle)}
                  size={40}
                  ring={prediction.isYou}
                  imageUrl={prediction.avatarUrl}
                />
                <div className="min-w-0 w-full">
                  <p className="truncate text-sm font-semibold">{prediction.displayName}</p>
                  <p className="truncate font-mono text-[10px] text-(--color-text3)">@{prediction.handle}</p>
                </div>
                <p className="font-mono text-2xl font-semibold tracking-tight text-primary drop-shadow-[0_0_18px_rgba(163,230,53,0.25)] sm:text-3xl">
                  {prediction.homeScore}-{prediction.awayScore}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function PlayerExtrasSection({
  match,
  players,
  draftScore,
  optimistic,
  extrasLocked,
  extrasSaving,
  extrasError,
  onSave,
  onScorer,
  onYellow,
  onRed,
}: {
  match: Match
  players: { home: PlayerDetail[]; away: PlayerDetail[] }
  draftScore: { home: number; away: number }
  optimistic: MatchPredictionState
  extrasLocked: boolean
  extrasSaving: boolean
  extrasError: string | null
  onSave: () => void
  onScorer: (id: number) => void
  onYellow: (id: number) => void
  onRed: (id: number) => void
}) {
  const [mobileSide, setMobileSide] = useState<"home" | "away">("home")

  return (
    <section className="min-w-0 rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi) p-3 shadow-[0_12px_36px_rgba(0,0,0,0.22)] sm:p-4">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2">
        <p className="font-mono text-[10px] uppercase tracking-wider text-(--color-text3)">Goles y tarjetas</p>
        <p className="font-mono text-[10px] text-(--color-text3) sm:text-[11px]">
          G {optimistic.scorerIds.length}/{MAX_SCORERS} · A {optimistic.yellowCardIds.length}/{MAX_YELLOW_CARDS} · R{" "}
          {optimistic.redCardIds.length}/{MAX_RED_CARDS}
        </p>
      </div>

      {extrasLocked ? (
        <p className="mb-3 rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 text-xs text-primary">
          Detalles guardados. Podés ver tus elecciones, pero ya no se pueden cambiar.
        </p>
      ) : null}

      <div className="mb-3 flex gap-2 lg:hidden">
        <SquadTab
          code={match.home}
          logo={match.homeLogo}
          active={mobileSide === "home"}
          onClick={() => setMobileSide("home")}
        />
        <SquadTab
          code={match.away}
          logo={match.awayLogo}
          active={mobileSide === "away"}
          onClick={() => setMobileSide("away")}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={mobileSide !== "home" ? "hidden lg:block" : ""}>
          <TeamExtrasPanel
            teamCode={match.home}
            teamLogo={match.homeLogo}
            teamSide="home"
            players={players.home}
            draftScore={draftScore}
            optimistic={optimistic}
            extrasLocked={extrasLocked}
            onScorer={onScorer}
            onYellow={onYellow}
            onRed={onRed}
          />
        </div>
        <div className={mobileSide !== "away" ? "hidden lg:block" : ""}>
          <TeamExtrasPanel
            teamCode={match.away}
            teamLogo={match.awayLogo}
            teamSide="away"
            players={players.away}
            draftScore={draftScore}
            optimistic={optimistic}
            extrasLocked={extrasLocked}
            onScorer={onScorer}
            onYellow={onYellow}
            onRed={onRed}
          />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <button
          type="button"
          disabled={extrasSaving || extrasLocked}
          onClick={onSave}
          className="h-11 w-full rounded-xl bg-(--color-primary) text-sm font-semibold text-black shadow-[0_8px_22px_rgba(163,230,53,0.28)] transition disabled:opacity-60"
        >
          {extrasLocked ? "Detalles guardados" : extrasSaving ? "Guardando detalles..." : "Guardar predicción"}
        </button>
        {extrasError ? <p className="text-center text-xs text-red-400">{extrasError}</p> : null}
      </div>
    </section>
  )
}

function TeamExtrasPanel({
  teamCode,
  teamLogo,
  teamSide,
  players,
  draftScore,
  optimistic,
  extrasLocked,
  onScorer,
  onYellow,
  onRed,
}: {
  teamCode: string
  teamLogo?: string | null
  teamSide: "home" | "away"
  players: PlayerDetail[]
  draftScore: { home: number; away: number }
  optimistic: MatchPredictionState
  extrasLocked: boolean
  onScorer: (id: number) => void
  onYellow: (id: number) => void
  onRed: (id: number) => void
}) {
  const scorerAllowed = canPickScorerForTeam({
    teamSide,
    homeScore: draftScore.home,
    awayScore: draftScore.away,
  })

  return (
    <div className="overflow-hidden rounded-xl border border-(--color-border-hi) bg-(--color-bg2)/40">
      <div className="flex items-center gap-2 border-b border-(--color-border-hi) px-3 py-2.5">
        {teamLogo ? (
          <img src={teamLogo} alt={teamCode} className="size-6 rounded-full border border-white/20 object-cover" />
        ) : (
          <Flag code={teamCode} size={24} />
        )}
        <p className="text-sm font-semibold">{teamCode}</p>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_28px_28px_28px] items-center gap-1 border-b border-(--color-border-hi) bg-(--color-bg2) px-2 py-2 sm:grid-cols-[1fr_40px_40px_40px] sm:gap-2 sm:px-3">
        <p className="font-mono text-[9px] tracking-wider text-(--color-text3) uppercase sm:text-[10px]">
          <span className="sm:hidden">Jugador</span>
          <span className="hidden sm:inline">Jugadores · G · A · R</span>
        </p>
        <LegendDot tone="primary" label="G" compact />
        <LegendDot tone="amber" label="A" compact />
        <LegendDot tone="red" label="R" compact />
      </div>

      {players.length === 0 ? (
        <p className="px-3 py-3 text-xs text-(--color-text3)">Plantel no disponible</p>
      ) : (
        <div>
          {players.map((player, idx) => {
            const scorerSelected = optimistic.scorerIds.includes(player.api_id)
            const yellowSelected = optimistic.yellowCardIds.includes(player.api_id)
            const redSelected = optimistic.redCardIds.includes(player.api_id)
            const blockScorer =
              extrasLocked || (!scorerSelected && optimistic.scorerIds.length >= MAX_SCORERS) || !scorerAllowed
            const blockYellow =
              extrasLocked || (!yellowSelected && optimistic.yellowCardIds.length >= MAX_YELLOW_CARDS)
            const blockRed = extrasLocked || (!redSelected && optimistic.redCardIds.length >= MAX_RED_CARDS)

            return (
              <PlayerExtrasRow
                key={player.api_id}
                player={player}
                bordered={idx < players.length - 1}
                scorerSelected={scorerSelected}
                yellowSelected={yellowSelected}
                redSelected={redSelected}
                blockScorer={blockScorer}
                blockYellow={blockYellow}
                blockRed={blockRed}
                onScorer={() => onScorer(player.api_id)}
                onYellow={() => onYellow(player.api_id)}
                onRed={() => onRed(player.api_id)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function LegendDot({ tone, label, compact = false }: { tone: "primary" | "amber" | "red"; label: string; compact?: boolean }) {
  const colorClass =
    tone === "primary" ? "border-primary/40 text-primary" : tone === "amber" ? "border-amber-400/40 text-amber-400" : "border-red-400/40 text-red-400"

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border font-bold ${
        compact ? "size-7 text-[10px] sm:size-8 sm:text-[11px]" : "size-8 text-[11px]"
      } ${colorClass}`}
    >
      {label}
    </span>
  )
}

function SquadTab({
  code,
  logo,
  active,
  onClick,
}: {
  code: string
  logo?: string | null
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={code}
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
        active
          ? "border-primary/45 bg-primary/15 text-primary shadow-[0_0_20px_rgba(163,230,53,0.12)]"
          : "border-(--color-border-hi) bg-(--color-bg2) text-(--color-text2)"
      }`}
    >
      {logo ? (
        <img src={logo} alt="" className="size-5 rounded-full border border-white/20 object-cover" />
      ) : (
        <Flag code={code} size={20} />
      )}
      <span>{code}</span>
    </button>
  )
}

function PlayerExtrasRow({
  player,
  bordered,
  scorerSelected,
  yellowSelected,
  redSelected,
  blockScorer,
  blockYellow,
  blockRed,
  onScorer,
  onYellow,
  onRed,
}: {
  player: PlayerDetail
  bordered: boolean
  scorerSelected: boolean
  yellowSelected: boolean
  redSelected: boolean
  blockScorer: boolean
  blockYellow: boolean
  blockRed: boolean
  onScorer: () => void
  onYellow: () => void
  onRed: () => void
}) {
  return (
    <div
      className={`grid grid-cols-[minmax(0,1fr)_28px_28px_28px] items-center gap-1 px-2 py-2 sm:grid-cols-[1fr_40px_40px_40px] sm:gap-2 sm:px-3 sm:py-2.5 ${
        bordered ? "border-b border-(--color-border-hi)" : ""
      }`}
    >
      <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
        {player.photo_url ? (
          <img
            src={player.photo_url}
            alt={player.name}
            className="size-7 shrink-0 rounded-full border border-white/15 object-cover shadow-[0_0_0_1px_rgba(255,255,255,0.08)] sm:size-8"
          />
        ) : (
          <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-(--color-border-hi) bg-(--color-card-hi) font-mono text-[9px] text-(--color-text2) sm:size-8 sm:text-[10px]">
            {player.name.slice(0, 2).toUpperCase()}
          </span>
        )}
        <p className="truncate text-xs font-medium text-foreground sm:text-sm">{player.name}</p>
      </div>
      <ToggleButton label="G" selected={scorerSelected} disabled={blockScorer} onClick={onScorer} tone="primary" compact />
      <ToggleButton label="A" selected={yellowSelected} disabled={blockYellow} onClick={onYellow} tone="amber" compact />
      <ToggleButton label="R" selected={redSelected} disabled={blockRed} onClick={onRed} tone="red" compact />
    </div>
  )
}

function ToggleButton({
  label,
  selected,
  disabled,
  onClick,
  tone,
  compact = false,
}: {
  label: string
  selected: boolean
  disabled: boolean
  onClick: () => void
  tone: "primary" | "amber" | "red"
  compact?: boolean
}) {
  const selectedClass =
    tone === "primary"
      ? "border-primary bg-primary/25 text-primary shadow-[0_0_16px_rgba(163,230,53,0.25)]"
      : tone === "amber"
        ? "border-amber-400 bg-amber-400/20 text-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.2)]"
        : "border-red-400 bg-red-400/20 text-red-300 shadow-[0_0_16px_rgba(248,113,113,0.2)]"

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      className={`inline-flex items-center justify-center rounded-full border-2 font-bold transition ${
        compact ? "size-7 text-[10px] sm:size-9 sm:text-[11px]" : "size-9 text-[11px]"
      } ${selected ? selectedClass : "border-(--color-border-hi) bg-(--color-card-hi) text-(--color-text3)"} ${disabled ? "opacity-45" : "hover:scale-[1.03]"}`}
    >
      {selected ? "✓" : label}
    </button>
  )
}

function KickoffCountdown({
  kickoff,
  className = "",
  variant = "inline",
}: {
  kickoff: string
  className?: string
  variant?: "inline" | "panel"
}) {
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(0)
  const [closed, setClosed] = useState(false)

  useEffect(() => {
    function tick() {
      const diff = new Date(kickoff).getTime() - Date.now()
      if (diff <= 0) {
        setClosed(true)
        setHours(0)
        setMinutes(0)
        return
      }
      setClosed(false)
      setHours(Math.floor(diff / 3_600_000))
      setMinutes(Math.floor((diff % 3_600_000) / 60_000))
    }

    tick()
    const id = window.setInterval(tick, 60_000)
    return () => window.clearInterval(id)
  }, [kickoff])

  if (variant === "panel") {
    return (
      <p className={`font-mono text-2xl font-semibold tracking-tight text-primary ${className}`}>
        {closed ? "Comienza pronto" : `${hours}h ${minutes}m`}
      </p>
    )
  }

  const label = closed ? "Comienza pronto" : `${hours}h ${minutes}m para el kickoff`
  return <p className={`font-mono text-xs text-primary ${className}`}>{label}</p>
}

export default MatchDetailScreen
