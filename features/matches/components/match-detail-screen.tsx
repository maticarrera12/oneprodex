"use client"

import Link from "next/link"
import { useState } from "react"

import { Flag } from "@/features/home/components/flag"
import { TEAMS } from "@/features/matches/mock"
import type { Match } from "@/features/matches/types"

type MatchDetailScreenProps = {
  match: Match
}

const QUICK_PICKS: Array<[number, number]> = [
  [1, 0],
  [2, 1],
  [2, 0],
  [1, 1],
  [0, 0],
  [0, 1],
  [1, 2],
  [3, 1],
]

const CONSENSUS = [
  { label: "Gana local", pct: 42 },
  { label: "Empate", pct: 28 },
  { label: "Gana visita", pct: 30 },
]

const TOP_SCORERS = ["Messi", "Mbappé", "Julián Álvarez", "Vinicius"]

export function MatchDetailScreen({ match }: MatchDetailScreenProps) {
  const home = TEAMS[match.home]
  const away = TEAMS[match.away]
  const isLive = match.status === "LIVE"
  const isFinished = match.status === "FINISHED"
  const lockedByStatus = isLive || isFinished

  const [homeScore, setHomeScore] = useState(match.pred?.hs ?? (match.hs ?? 1))
  const [awayScore, setAwayScore] = useState(match.pred?.as ?? (match.as ?? 0))
  const [confidence, setConfidence] = useState(70)
  const [firstScorer, setFirstScorer] = useState(TOP_SCORERS[0])
  const [locked, setLocked] = useState(Boolean(match.pred) || lockedByStatus)

  const selectedOutcome = homeScore > awayScore ? "Gana local" : homeScore < awayScore ? "Gana visita" : "Empate"

  return (
    <div className="space-y-4 pt-4 pb-28">
      <section className="relative overflow-hidden rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi) p-4">
        <span
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            background: `linear-gradient(180deg, ${home?.c1 ?? "#84CC16"}33 0%, transparent 55%), linear-gradient(0deg, ${away?.c1 ?? "#84CC16"}2E 0%, transparent 55%)`,
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
              <span className="rounded-full border border-(--color-lime-deep) bg-(--color-lime-bg) px-3 py-1 font-mono text-xs font-semibold text-(--color-lime-hi)">
                EN VIVO · {match.minute ?? 0}&apos;
              </span>
            ) : (
              <span className="rounded-full border border-(--color-border-hi) bg-(--color-bg2) px-3 py-1 font-mono text-xs text-(--color-text2)">
                {isFinished ? "Final" : match.kickoff}
              </span>
            )}
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="flex flex-col items-center gap-2">
              <Flag code={match.home} size={62} />
              <p className="text-sm font-semibold">{home?.name ?? match.home}</p>
            </div>
            <p className="font-mono text-xs tracking-wider text-(--color-text3)">VS</p>
            <div className="flex flex-col items-center gap-2">
              <Flag code={match.away} size={62} />
              <p className="text-sm font-semibold">{away?.name ?? match.away}</p>
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
        {["Predecir", "Alineaciones", "H2H", "Grupo"].map((tab, index) => (
          <span
            key={tab}
            className={`rounded-full border px-3 py-1.5 text-xs whitespace-nowrap ${
              index === 0
                ? "border-(--color-lime-deep) bg-(--color-lime-bg) text-(--color-lime-hi)"
                : "border-(--color-border-hi) bg-(--color-card-hi) text-(--color-text3)"
            }`}
          >
            {tab}
          </span>
        ))}
      </div>

      <section className="rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi)">
        <div className="flex items-center justify-between p-4 pb-2">
          <p className="font-mono text-[11px] tracking-wider text-(--color-text3) uppercase">Tu predicción</p>
          <p className={`font-mono text-[11px] ${locked ? "text-(--color-lime-hi)" : "text-(--color-amber)"}`}>
            {locked ? "BLOQUEADA" : "ABIERTA · 4h 12m"}
          </p>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 pb-4">
          <Stepper value={homeScore} disabled={locked} onChange={setHomeScore} />
          <span className="font-mono text-3xl text-(--color-text3)">·</span>
          <Stepper value={awayScore} disabled={locked} onChange={setAwayScore} />
        </div>

        <div className="flex gap-2 overflow-x-auto px-4 pb-4 scrollbar-none">
          {QUICK_PICKS.map(([hs, as]) => {
            const selected = hs === homeScore && as === awayScore
            return (
              <button
                key={`${hs}-${as}`}
                type="button"
                disabled={locked}
                onClick={() => {
                  setHomeScore(hs)
                  setAwayScore(as)
                }}
                className={`rounded-lg border px-2.5 py-1.5 font-mono text-xs whitespace-nowrap transition ${
                  selected
                    ? "border-(--color-lime-deep) bg-(--color-lime-bg) text-(--color-lime-hi)"
                    : "border-(--color-border-hi) bg-(--color-bg2) text-(--color-text2)"
                } ${locked ? "opacity-60" : ""}`}
              >
                {hs}–{as}
              </button>
            )
          })}
        </div>

        <div className="border-t border-(--color-border-hi) p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-(--color-text2)">Multiplicador de confianza</p>
            <p className="font-mono text-sm font-semibold text-(--color-lime-hi)">×{(1 + confidence / 100).toFixed(1)}</p>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={confidence}
            disabled={locked}
            onChange={(event) => setConfidence(Number(event.target.value))}
            className="accent-(--color-lime-hi) w-full"
          />
        </div>

        <div className="border-t border-(--color-border-hi) p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-mono text-[11px] tracking-wider text-(--color-text3) uppercase">Primer goleador · +3 pts</p>
            <button type="button" className="rounded-lg border border-(--color-border-hi) bg-(--color-bg2) px-2.5 py-1 text-xs">
              Cambiar
            </button>
          </div>
          <div className="flex gap-2">
            {TOP_SCORERS.map((player) => (
              <button
                key={player}
                type="button"
                disabled={locked}
                onClick={() => setFirstScorer(player)}
                className={`rounded-lg border px-2.5 py-1 text-xs ${
                  firstScorer === player
                    ? "border-(--color-lime-deep) bg-(--color-lime-bg) text-(--color-lime-hi)"
                    : "border-(--color-border-hi) bg-(--color-bg2) text-(--color-text2)"
                }`}
              >
                {player}
              </button>
            ))}
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={() => setLocked(true)}
        disabled={locked}
        className={`h-12 w-full rounded-xl font-semibold transition ${
          locked
            ? "border border-(--color-lime-deep) bg-(--color-lime-bg) text-(--color-lime-hi)"
            : "bg-(--color-lime-hi) text-black shadow-[0_8px_22px_rgba(163,230,53,0.35)]"
        }`}
      >
        {locked ? `Bloqueada · ${homeScore}-${awayScore} · ×${(1 + confidence / 100).toFixed(1)}` : `Bloquear predicción · ${homeScore}-${awayScore}`}
      </button>

      <section>
        <p className="mb-2 text-xs font-semibold tracking-wider text-(--color-text2) uppercase">Les Cracks · consenso</p>
        <div className="rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi) p-4">
          <div className="space-y-3">
            {CONSENSUS.map((item) => {
              const favorite = item.label === selectedOutcome
              return (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <p className={favorite ? "font-semibold text-(--color-lime-hi)" : "text-(--color-text2)"}>{item.label}</p>
                    <p className={favorite ? "font-mono text-(--color-lime-hi)" : "font-mono text-(--color-text2)"}>{item.pct}%</p>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded bg-white/8">
                    <span
                      className={`block h-full rounded ${favorite ? "bg-(--color-lime-hi) shadow-[0_0_10px_rgba(163,230,53,0.4)]" : "bg-white/20"}`}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}

export default MatchDetailScreen

function Stepper({
  value,
  disabled,
  onChange,
}: {
  value: number
  disabled: boolean
  onChange: (value: number) => void
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(Math.min(9, value + 1))}
        className="inline-flex h-7 w-9 items-center justify-center rounded-lg border border-(--color-border-hi) bg-(--color-bg2)"
      >
        <svg width="11" height="7" viewBox="0 0 11 7">
          <path
            d="M1 6 5.5 1 10 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <p className="w-14 text-center font-mono text-5xl font-semibold leading-none tracking-tight">{value}</p>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(Math.max(0, value - 1))}
        className="inline-flex h-7 w-9 items-center justify-center rounded-lg border border-(--color-border-hi) bg-(--color-bg2)"
      >
        <svg width="11" height="7" viewBox="0 0 11 7" className="rotate-180">
          <path
            d="M1 6 5.5 1 10 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  )
}
