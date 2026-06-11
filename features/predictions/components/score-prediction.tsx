'use client'

import { MATCH_SCORING_LABELS } from "@/features/scoring/constants"

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

type ScorePredictionProps = {
  matchId: string
  homeTeamCode: string
  awayTeamCode: string
  homeScore: number
  awayScore: number
  onChange: (home: number, away: number) => void
  isLocked: boolean
  onSubmit: (home: number, away: number) => void
  showSubmit?: boolean
}

export function ScorePrediction({
  homeScore,
  awayScore,
  onChange,
  isLocked,
  onSubmit,
  showSubmit = true,
}: ScorePredictionProps) {
  return (
    <>
      <div className="flex items-center justify-between p-4 pb-2">
        <p className="font-mono text-[11px] tracking-wider text-(--color-text3) uppercase">Tu predicción</p>
        <p className={`font-mono text-[11px] ${isLocked ? 'text-(--color-primary)' : 'text-(--color-amber)'}`}>
          {isLocked ? 'BLOQUEADA' : 'ABIERTA'}
        </p>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 pb-4">
        <Stepper
          value={homeScore}
          disabled={isLocked}
          onChange={(nextHome) => onChange(nextHome, awayScore)}
        />
        <span className="font-mono text-3xl text-(--color-text3)">·</span>
        <Stepper
          value={awayScore}
          disabled={isLocked}
          onChange={(nextAway) => onChange(homeScore, nextAway)}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto px-4 pb-4 scrollbar-none">
        {QUICK_PICKS.map(([hs, as]) => {
          const selected = hs === homeScore && as === awayScore
          return (
            <button
              key={`${hs}-${as}`}
              type="button"
              disabled={isLocked}
              onClick={() => {
                onChange(hs, as)
              }}
              className={`rounded-lg border px-2.5 py-1.5 font-mono text-xs whitespace-nowrap transition ${
                selected
                  ? 'border-(--color-lime-deep) bg-(--color-lime-bg) text-(--color-primary)'
                  : 'border-(--color-border-hi) bg-(--color-bg2) text-(--color-text2)'
              } ${isLocked ? 'opacity-60' : ''}`}
            >
              {hs}–{as}
            </button>
          )
        })}
      </div>

      {!isLocked && showSubmit && (
        <>
          <div className="flex items-center justify-center gap-3 px-4 pb-3">
            <span className="font-mono text-[11px] text-(--color-text3)">{MATCH_SCORING_LABELS.exactScore}</span>
            <span className="text-(--color-text4)">·</span>
            <span className="font-mono text-[11px] text-(--color-text3)">{MATCH_SCORING_LABELS.correctResult}</span>
          </div>
          <div className="border-t border-(--color-border-hi) px-4 pb-4 pt-3">
            <button
              type="button"
              onClick={() => onSubmit(homeScore, awayScore)}
              className="h-10 w-full rounded-xl bg-(--color-primary) font-semibold text-black text-sm shadow-[0_8px_22px_rgba(163,230,53,0.35)] transition"
            >
              Guardar {homeScore}–{awayScore}
            </button>
          </div>
        </>
      )}
    </>
  )
}

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
