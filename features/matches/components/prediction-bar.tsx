const NEUTRAL_COLOR = "#9CA3AF"

type PredictionBarProps = {
  homePct: number
  drawPct: number
  awayPct: number
  homeColor?: string | null
  awayColor?: string | null
  advice?: string | null
}

export function PredictionBar({ homePct, drawPct, awayPct, homeColor, awayColor, advice }: PredictionBarProps) {
  return (
    <div className="space-y-1">
    <div
      role="img"
      aria-label={`Win probability: Home ${homePct}%, Draw ${drawPct}%, Away ${awayPct}%`}
      className="flex h-8 w-full overflow-hidden rounded-lg"
    >
      <div
        aria-label={`Home team: ${homePct}% win probability`}
        className="flex items-center justify-center overflow-hidden text-xs font-semibold text-white transition-all"
        style={{
          width: `${homePct}%`,
          backgroundColor: homeColor ?? NEUTRAL_COLOR,
        }}
      >
        {homePct > 0 ? `${homePct}%` : <span className="sr-only">{homePct}%</span>}
      </div>
      <div
        aria-label={`Draw: ${drawPct}% probability`}
        className="flex items-center justify-center overflow-hidden text-xs font-semibold text-white transition-all"
        style={{
          width: `${drawPct}%`,
          backgroundColor: NEUTRAL_COLOR,
        }}
      >
        {drawPct > 0 ? `${drawPct}%` : <span className="sr-only">{drawPct}%</span>}
      </div>
      <div
        aria-label={`Away team: ${awayPct}% win probability`}
        className="flex items-center justify-center overflow-hidden text-xs font-semibold text-white transition-all"
        style={{
          width: `${awayPct}%`,
          backgroundColor: awayColor ?? NEUTRAL_COLOR,
        }}
      >
        {awayPct > 0 ? `${awayPct}%` : <span className="sr-only">{awayPct}%</span>}
      </div>
    </div>
    {advice ? (
      <p data-testid="prediction-advice" className="text-center font-mono text-[10px] text-(--color-text3)">
        {advice}
      </p>
    ) : null}
    </div>
  )
}

export default PredictionBar
