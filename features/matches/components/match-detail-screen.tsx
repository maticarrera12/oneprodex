"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

import { Flag } from "@/features/home/components/flag"
import { CleanSheetToggle } from "@/features/predictions/components/clean-sheet-toggle"
import { PointsBreakdown } from "@/features/predictions/components/points-breakdown"
import { ScorePrediction } from "@/features/predictions/components/score-prediction"
import { usePrediction } from "@/features/predictions/hooks/usePrediction"
import type { MatchConsensusGroup } from "@/features/predictions/api"
import type { MatchEvent, MatchPredictionState, PlayerDetail } from "@/features/predictions/types"
import { MAX_RED_CARDS, MAX_SCORERS, MAX_YELLOW_CARDS } from "@/features/predictions/types"
import type { Match } from "@/features/matches/types"
import { canPickScorerForTeam, derivePredictionFlow } from "@/features/matches/utils/prediction-flow"
import { formatKickoffParts } from "@/features/matches/utils/kickoff"
import { LineupsPanel } from "@/features/matches/components/lineups-panel"
import { H2HPanel } from "@/features/matches/components/h2h-panel"
import type { MatchLineupRow, MatchH2HRow } from "@/lib/api-football/types"

const TAB = {
  PREDECIR: "Predecir",
  ALINEACIONES: "Alineaciones",
  H2H: "H2H",
  GRUPO: "Grupo",
} as const

type ActiveTab = (typeof TAB)[keyof typeof TAB]

const EMPTY_LINEUPS: { home: MatchLineupRow[]; away: MatchLineupRow[] } = { home: [], away: [] }
const EMPTY_H2H: MatchH2HRow[] = []

type MatchDetailScreenProps = {
  match: Match
  predictionState: MatchPredictionState
  players: { home: PlayerDetail[]; away: PlayerDetail[] }
  events: MatchEvent[]
  consensusGroups: MatchConsensusGroup[]
  lineups?: { home: MatchLineupRow[]; away: MatchLineupRow[] }
  h2h?: MatchH2HRow[]
}

export function MatchDetailScreen({ match, predictionState, players, events, consensusGroups, lineups = EMPTY_LINEUPS, h2h = EMPTY_H2H }: MatchDetailScreenProps) {
  const router = useRouter()
  const isLive = match.status === "LIVE"
  const isFinished = match.status === "FINISHED"
  const editLocked = predictionState.editLocked
  const predictionFlow = derivePredictionFlow({
    matchStatus: match.status,
    hasScore: Boolean(predictionState.score),
    editLocked,
  })
  const kickoff = formatKickoffParts(match.kickoff)
  const [activeTab, setActiveTab] = useState<ActiveTab>(TAB.PREDECIR)
  const [selectedSquad, setSelectedSquad] = useState<"home" | "away">("home")

  const { optimistic, toggleScorer, toggleYellowCard, toggleRedCard, toggleCleanSheet, handleScoreSubmit, handleExtrasSubmit } = usePrediction(
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

  const activePlayers = useMemo(
    () => (selectedSquad === "home" ? players.home : players.away),
    [players.away, players.home, selectedSquad],
  )

  const persistedHome = optimistic.score?.home_score ?? match.pred?.hs ?? 0
  const persistedAway = optimistic.score?.away_score ?? match.pred?.as ?? 0
  const [draftScore, setDraftScore] = useState({ home: persistedHome, away: persistedAway })

  useEffect(() => {
    setDraftScore({ home: persistedHome, away: persistedAway })
  }, [match.id, persistedHome, persistedAway])

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
      setExtrasError(result.error === "already_locked" ? "Estos detalles ya fueron guardados." : "No se pudieron guardar los detalles.")
      return
    }

    router.refresh()
  }

  return (
    <div className="space-y-4 pt-4 pb-28">
      <section className="relative overflow-hidden rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi) p-4">
        <span
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            background: `linear-gradient(180deg, #84CC1633 0%, transparent 55%), linear-gradient(0deg, #84CC162E 0%, transparent 55%)`,
          }}
        />
        <div className="relative">
          <div className="mb-4 flex items-center justify-between">
            <Link
              href="/partidos"
              className="inline-flex size-10 items-center justify-center rounded-xl border border-(--color-border-hi) bg-(--color-bg2)"
            >
              <svg width="16" height="16" viewBox="0 0 16 16">
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
            <div className="text-center">
              <p className="font-mono text-[10px] tracking-wider text-(--color-text3) uppercase">{match.stage}</p>
              <p className="text-xs text-(--color-text2)">{match.venue ?? "World Cup 2026"}</p>
            </div>
            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-xl border border-(--color-border-hi) bg-(--color-bg2)"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 6l5-3 5 3v6l-5 3-5-3V6Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className="mb-4 flex justify-center">
            {isLive ? (
              <span className="rounded-full border border-(--color-lime-deep) bg-(--color-lime-bg) px-3 py-1 font-mono text-xs font-semibold text-(--color-primary)">
                EN VIVO · {match.minute ?? 0}&apos;
              </span>
            ) : (
              <span className="rounded-full border border-(--color-border-hi) bg-(--color-bg2) px-3 py-1 font-mono text-xs text-(--color-text2)">
                {isFinished ? "Final" : `${kickoff.date} · ${kickoff.time}`}
              </span>
            )}
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="flex flex-col items-center gap-2">
              {match.homeLogo ? (
                <img
                  src={match.homeLogo}
                  alt={match.home}
                  className="size-[62px] rounded-full border border-white/20 object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.2)]"
                />
              ) : (
                <Flag code={match.home} size={62} />
              )}
              <p className="text-sm font-semibold">{match.home}</p>
            </div>
            <p className="font-mono text-xs tracking-wider text-(--color-text3)">VS</p>
            <div className="flex flex-col items-center gap-2">
              {match.awayLogo ? (
                <img
                  src={match.awayLogo}
                  alt={match.away}
                  className="size-[62px] rounded-full border border-white/20 object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.2)]"
                />
              ) : (
                <Flag code={match.away} size={62} />
              )}
              <p className="text-sm font-semibold">{match.away}</p>
            </div>
          </div>

          {(isLive || isFinished) && (
            <div className="mt-4 flex items-center justify-center gap-4 font-mono">
              <p className="text-5xl font-semibold tracking-tight" style={{ textShadow: "0 0 18px rgba(163,230,53,0.2)" }}>
                {match.hs ?? 0}
              </p>
              <span className="text-4xl text-(--color-text4)">·</span>
              <p className="text-5xl font-semibold tracking-tight" style={{ textShadow: "0 0 18px rgba(163,230,53,0.2)" }}>
                {match.as ?? 0}
              </p>
            </div>
          )}
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {([TAB.PREDECIR, TAB.ALINEACIONES, TAB.H2H, TAB.GRUPO] as ActiveTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-full border px-3 py-1.5 text-xs whitespace-nowrap ${
              activeTab === tab
                ? "border-(--color-lime-deep) bg-(--color-lime-bg) text-(--color-primary)"
                : "border-(--color-border-hi) bg-(--color-card-hi) text-(--color-text3)"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === TAB.ALINEACIONES && (
        <LineupsPanel lineups={lineups} playersMap={new Map()} />
      )}

      {activeTab === TAB.H2H && (
        <H2HPanel h2h={h2h} />
      )}

      {(activeTab === TAB.PREDECIR || activeTab === TAB.GRUPO) && (
      <>
      <section className="rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi)">
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
      </section>

      {predictionFlow.extrasVisible ? (
      <section className="rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi) p-3">
        {predictionFlow.extrasLocked ? (
          <p className="mb-3 rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 text-xs text-primary">
            Detalles guardados. Podés ver tus elecciones, pero ya no se pueden cambiar.
          </p>
        ) : null}
        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={() => setSelectedSquad("home")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
              selectedSquad === "home"
                ? "border-primary/45 bg-primary/15 text-primary"
                : "border-(--color-border-hi) bg-(--color-bg2) text-(--color-text2)"
            }`}
          >
            {match.homeLogo ? (
              <img
                src={match.homeLogo}
                alt={match.home}
                className="size-5 rounded-full border border-white/20 object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.2)]"
              />
            ) : (
              <Flag code={match.home} size={20} />
            )}
            <span>{match.home}</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedSquad("away")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
              selectedSquad === "away"
                ? "border-primary/45 bg-primary/15 text-primary"
                : "border-(--color-border-hi) bg-(--color-bg2) text-(--color-text2)"
            }`}
          >
            {match.awayLogo ? (
              <img
                src={match.awayLogo}
                alt={match.away}
                className="size-5 rounded-full border border-white/20 object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.2)]"
              />
            ) : (
              <Flag code={match.away} size={20} />
            )}
            <span>{match.away}</span>
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-(--color-border-hi)">
          <div className="grid grid-cols-[1fr_36px_36px_36px] items-center gap-2 border-b border-(--color-border-hi) bg-(--color-bg2) px-3 py-2">
            <p className="font-mono text-[11px] tracking-wider text-(--color-text3) uppercase">
              Jugadores · G {optimistic.scorerIds.length}/{MAX_SCORERS} · A {optimistic.yellowCardIds.length}/{MAX_YELLOW_CARDS} · R {optimistic.redCardIds.length}/{MAX_RED_CARDS}
            </p>
            <span className="inline-flex items-center justify-center text-primary" title="Gol">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4" />
                <path d="M8 3.8 10.9 5.5l-.2 3.3L8 10.6 5.3 8.8l-.2-3.3L8 3.8Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="inline-flex items-center justify-center text-amber-400" title="Tarjeta amarilla">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <rect x="4" y="2.5" width="8" height="11" rx="1.3" fill="currentColor" />
              </svg>
            </span>
            <span className="inline-flex items-center justify-center text-red-400" title="Tarjeta roja">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <rect x="4" y="2.5" width="8" height="11" rx="1.3" fill="currentColor" />
              </svg>
            </span>
          </div>

          {activePlayers.length === 0 ? (
            <p className="px-3 py-3 text-xs text-(--color-text3)">Plantel no disponible</p>
          ) : (
            <div>
              {activePlayers.map((player, idx) => {
                const scorerSelected = optimistic.scorerIds.includes(player.api_id)
                const yellowSelected = optimistic.yellowCardIds.includes(player.api_id)
                const redSelected = optimistic.redCardIds.includes(player.api_id)
                const scorerAllowedForSide = canPickScorerForTeam({
                  teamSide: selectedSquad,
                  homeScore: draftScore.home,
                  awayScore: draftScore.away,
                })
                const blockScorer =
                  predictionFlow.extrasLocked ||
                  (!scorerSelected && optimistic.scorerIds.length >= MAX_SCORERS) ||
                  !scorerAllowedForSide
                const blockYellow =
                  predictionFlow.extrasLocked || (!yellowSelected && optimistic.yellowCardIds.length >= MAX_YELLOW_CARDS)
                const blockRed =
                  predictionFlow.extrasLocked || (!redSelected && optimistic.redCardIds.length >= MAX_RED_CARDS)

                return (
                  <div
                    key={player.api_id}
                    className={`grid grid-cols-[1fr_36px_36px_36px] items-center gap-2 px-3 py-2 ${
                      idx < activePlayers.length - 1 ? "border-b border-(--color-border-hi)" : ""
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      {player.photo_url ? (
                        <img
                          src={player.photo_url}
                          alt={player.name}
                          className="size-7 rounded-full border border-white/15 object-cover"
                        />
                      ) : (
                        <span className="inline-flex size-7 items-center justify-center rounded-full border border-(--color-border-hi) bg-(--color-bg2) font-mono text-[10px] text-(--color-text2)">
                          {player.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                      <p className="truncate text-sm text-foreground">{player.name}</p>
                    </div>
                    <button
                      type="button"
                      disabled={blockScorer}
                      onClick={() => toggleScorer(player.api_id)}
                      className={`inline-flex size-8 items-center justify-center rounded-md border text-xs font-semibold transition ${
                        scorerSelected
                          ? "border-primary/45 bg-primary/20 text-primary"
                          : "border-(--color-border-hi) bg-(--color-bg2) text-(--color-text3)"
                      } ${blockScorer ? "opacity-50" : ""}`}
                    >
                      G
                    </button>
                    <button
                      type="button"
                      disabled={blockYellow}
                      onClick={() => toggleYellowCard(player.api_id)}
                      className={`inline-flex size-8 items-center justify-center rounded-md border text-xs font-semibold transition ${
                        yellowSelected
                          ? "border-amber-400/45 bg-amber-400/20 text-amber-400"
                          : "border-(--color-border-hi) bg-(--color-bg2) text-(--color-text3)"
                      } ${blockYellow ? "opacity-50" : ""}`}
                    >
                      A
                    </button>
                    <button
                      type="button"
                      disabled={blockRed}
                      onClick={() => toggleRedCard(player.api_id)}
                      className={`inline-flex size-8 items-center justify-center rounded-md border text-xs font-semibold transition ${
                        redSelected
                          ? "border-red-400/45 bg-red-400/20 text-red-400"
                          : "border-(--color-border-hi) bg-(--color-bg2) text-(--color-text3)"
                      } ${blockRed ? "opacity-50" : ""}`}
                    >
                      R
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="mt-3 space-y-2">
          <button
            type="button"
            disabled={extrasSaving || predictionFlow.extrasLocked}
            onClick={saveExtras}
            className="h-11 w-full rounded-xl bg-(--color-primary) text-sm font-semibold text-black shadow-[0_8px_22px_rgba(163,230,53,0.28)] transition disabled:opacity-60"
          >
            {predictionFlow.extrasLocked
              ? "Detalles guardados"
              : extrasSaving
                ? "Guardando detalles..."
                : "Guardar predicción"}
          </button>
          {extrasError ? <p className="text-center text-xs text-red-400">{extrasError}</p> : null}
        </div>
      </section>
      ) : null}

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

      {isFinished && (
        <PointsBreakdown
          prediction={optimistic.score}
          match={{ hs: match.hs, as: match.as, home: match.home, away: match.away }}
          scorerIds={optimistic.scorerIds}
          yellowCardIds={optimistic.yellowCardIds}
          redCardIds={optimistic.redCardIds}
          cleanSheetCodes={cleanSheetCodes}
          events={events}
        />
      )}

      <ConsensusSection groups={consensusGroups} home={match.home} away={match.away} />

      </>
      )}

    </div>
  )
}

function ConsensusSection({
  groups,
  home,
  away,
}: {
  groups: MatchConsensusGroup[]
  home: string
  away: string
}) {
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id ?? "")
  const selectedGroup = groups.find((group) => group.id === selectedGroupId) ?? groups[0]

  useEffect(() => {
    setSelectedGroupId(groups[0]?.id ?? "")
  }, [groups])

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-wider text-(--color-text2) uppercase">
          {groups.length === 0 ? "Unite a un grupo" : "Consenso del grupo"}
        </p>
        {groups.length === 1 ? (
          <p className="truncate font-mono text-[10px] text-primary">{groups[0]?.name}</p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi) p-4">
        {groups.length === 0 ? (
          <p className="text-sm text-(--color-text3)">Cuando estés en un grupo vas a ver las predicciones de otros participantes para este partido.</p>
        ) : (
          <div className="space-y-3">
            {groups.length > 1 ? (
              <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1">
                {groups.map((group) => {
                  const active = group.id === selectedGroup?.id
                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => setSelectedGroupId(group.id)}
                      className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        active
                          ? "border-primary/45 bg-primary/15 text-primary"
                          : "border-(--color-border-hi) bg-(--color-bg2) text-(--color-text2)"
                      }`}
                    >
                      {group.name}
                    </button>
                  )
                })}
              </div>
            ) : null}

            {selectedGroup ? (
              <>
                <div className="rounded-xl border border-(--color-border-hi) bg-(--color-bg2) p-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-(--color-text3)">
                    {selectedGroup.name}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {selectedGroup.summary.topScore
                          ? `Marcador más elegido: ${selectedGroup.summary.topScore}`
                          : "Todavía no hay predicciones"}
                      </p>
                      <p className="mt-0.5 text-xs text-(--color-text3)">
                        {selectedGroup.summary.count > 0
                          ? `${selectedGroup.summary.count} predicción${selectedGroup.summary.count === 1 ? "" : "es"} cargada${selectedGroup.summary.count === 1 ? "" : "s"}`
                          : `Cuando alguien prediga ${home} - ${away}, aparece acá.`}
                      </p>
                    </div>
                    {selectedGroup.summary.topScore ? (
                      <span className="rounded-full border border-primary/35 bg-primary/15 px-3 py-1 font-mono text-xs font-semibold text-primary">
                        {selectedGroup.summary.topScoreCount}x
                      </span>
                    ) : null}
                  </div>
                </div>

                {selectedGroup.predictions.length > 0 ? (
                  <div className="space-y-2">
                    {selectedGroup.predictions.map((prediction) => (
                      <div
                        key={prediction.userId}
                        className="flex items-center justify-between gap-3 rounded-xl border border-(--color-border-hi) bg-(--color-bg2) px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{prediction.displayName}</p>
                          <p className="font-mono text-[10px] text-(--color-text3)">@{prediction.handle}</p>
                        </div>
                        <span className="rounded-lg border border-(--color-border-hi) bg-background px-2.5 py-1 font-mono text-sm font-semibold">
                          {prediction.homeScore}-{prediction.awayScore}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        )}
      </div>
    </section>
  )
}

export default MatchDetailScreen
