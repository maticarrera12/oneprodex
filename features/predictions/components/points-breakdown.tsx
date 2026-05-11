'use client'

import {
  calcScorePts,
  calcPlayerScorerPts,
  calcCardPts,
  calcCleanSheetPts,
} from '@/features/predictions/utils/scoring'
import type { MatchEvent } from '@/features/predictions/types'

type PointsBreakdownProps = {
  prediction: { home_score: number; away_score: number } | null
  match: { hs: number | null; as: number | null; home: string; away: string }
  scorerIds: number[]
  yellowCardIds: number[]
  redCardIds: number[]
  cleanSheetCodes: string[]
  events: MatchEvent[]
}

export function PointsBreakdown({
  prediction,
  match,
  scorerIds,
  yellowCardIds,
  redCardIds,
  cleanSheetCodes,
  events,
}: PointsBreakdownProps) {
  if (!prediction) return null

  const goalScorerApiIds = events
    .filter((e) => e.type === 'GOAL' && e.player_api_id !== null)
    .map((e) => e.player_api_id as number)

  const yellowCardedApiIds = events
    .filter((e) => e.type === 'YELLOW_CARD' && e.player_api_id !== null)
    .map((e) => e.player_api_id as number)

  const redCardedApiIds = events
    .filter((e) => (e.type === 'RED_CARD' || e.type === 'Second Yellow card') && e.player_api_id !== null)
    .map((e) => e.player_api_id as number)

  const scorePts = calcScorePts(
    { home_score: prediction.home_score, away_score: prediction.away_score },
    { home: match.hs, away: match.as },
  )
  const scorerPts = calcPlayerScorerPts(scorerIds, goalScorerApiIds)
  const cardPts = calcCardPts(yellowCardIds, redCardIds, yellowCardedApiIds, redCardedApiIds)
  // calcCleanSheetPts: homeScore = goals conceded by home = match.as, awayScore = goals conceded by away = match.hs
  const cleanSheetPts = calcCleanSheetPts(cleanSheetCodes, match.home, match.away, match.as, match.hs)
  const total = scorePts + scorerPts + cardPts + cleanSheetPts

  const rows: Array<{ label: string; pts: number }> = [
    { label: 'Resultado', pts: scorePts },
    { label: 'Goleadores', pts: scorerPts },
    { label: 'Tarjetas', pts: cardPts },
    { label: 'Arco en 0', pts: cleanSheetPts },
  ]

  return (
    <div className="rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi) p-4">
      <p className="mb-3 font-mono text-[11px] tracking-wider text-(--color-text3) uppercase">Tus puntos</p>
      <div className="space-y-2">
        {rows.map(({ label, pts }) => (
          <div key={label} className="flex items-center justify-between">
            <p className="text-sm text-(--color-text2)">{label}</p>
            <p className={`font-mono text-sm font-semibold ${pts > 0 ? 'text-(--color-lime-hi)' : 'text-(--color-text3)'}`}>
              +{pts}
            </p>
          </div>
        ))}
        <div className="border-t border-(--color-border-hi) pt-2 flex items-center justify-between">
          <p className="font-semibold">Total</p>
          <p className="font-mono text-lg font-semibold text-(--color-lime-hi)">+{total}</p>
        </div>
      </div>
    </div>
  )
}
