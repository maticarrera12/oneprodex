'use client'

import { MATCH_SCORING_LABELS } from "@/features/scoring/constants"

type CleanSheetToggleProps = {
  matchId: string
  homeTeamCode: string
  awayTeamCode: string
  homeGoalsPredicted: number
  awayGoalsPredicted: number
  selectedCodes: string[]
  onToggle: (teamCode: string) => void
  isLocked: boolean
}

export function CleanSheetToggle({
  homeTeamCode,
  awayTeamCode,
  homeGoalsPredicted,
  awayGoalsPredicted,
  selectedCodes,
  onToggle,
  isLocked,
}: CleanSheetToggleProps) {
  return (
    <div className="rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi) p-4">
      <p className="mb-3 text-center font-mono text-[11px] tracking-wider text-(--color-text3) uppercase">
        {MATCH_SCORING_LABELS.cleanSheet}
      </p>
      <div className="mb-2 flex justify-center gap-2">
        {[homeTeamCode, awayTeamCode].map((code) => {
          const selected = selectedCodes.includes(code)
          const disabled = true
          return (
            <button
              key={code}
              type="button"
              disabled={disabled}
              onClick={() => onToggle(code)}
              className={`rounded-full border px-4 py-1.5 text-sm font-mono transition ${
                selected
                  ? 'border-(--color-lime-deep) bg-(--color-lime-bg) text-(--color-primary)'
                  : 'border-(--color-border-hi) bg-(--color-bg2) text-(--color-text2)'
              } ${disabled ? 'opacity-60' : ''}`}
            >
              {code}
            </button>
          )
        })}
      </div>
      <p className="text-center text-[11px] text-(--color-text3)">
        Se define automáticamente por marcador ({homeGoalsPredicted}-{awayGoalsPredicted})
      </p>
    </div>
  )
}
