const NEUTRAL_COLOR = "#9CA3AF"

type PredictionBarProps = {
  homePct: number
  drawPct: number
  awayPct: number
  homeColor?: string | null
  awayColor?: string | null
  advice?: string | null
  variant?: "default" | "inline"
}

export function PredictionBar({
  homePct,
  drawPct,
  awayPct,
  homeColor,
  awayColor,
  advice,
  variant = "default",
}: PredictionBarProps) {
  const inline = variant === "inline"

  return (
    <div className={inline ? "space-y-1" : "space-y-1"}>
      <div
        role="img"
        aria-label={`Win probability: Home ${homePct}%, Draw ${drawPct}%, Away ${awayPct}%`}
        className={`flex w-full overflow-hidden ${inline ? "h-1 rounded-full opacity-80" : "h-8 rounded-lg"}`}
      >
        <div
          aria-label={`Home team: ${homePct}% win probability`}
          className={`overflow-hidden transition-all ${inline ? "" : "flex items-center justify-center text-xs font-semibold text-white"}`}
          style={{
            width: `${homePct}%`,
            backgroundColor: homeColor ?? NEUTRAL_COLOR,
          }}
        >
          {inline || homePct === 0 ? (
            <span className="sr-only">{homePct}%</span>
          ) : (
            `${homePct}%`
          )}
        </div>
        <div
          aria-label={`Draw: ${drawPct}% probability`}
          className={`overflow-hidden transition-all ${inline ? "" : "flex items-center justify-center text-xs font-semibold text-white"}`}
          style={{
            width: `${drawPct}%`,
            backgroundColor: NEUTRAL_COLOR,
          }}
        >
          {inline || drawPct === 0 ? (
            <span className="sr-only">{drawPct}%</span>
          ) : (
            `${drawPct}%`
          )}
        </div>
        <div
          aria-label={`Away team: ${awayPct}% win probability`}
          className={`overflow-hidden transition-all ${inline ? "" : "flex items-center justify-center text-xs font-semibold text-white"}`}
          style={{
            width: `${awayPct}%`,
            backgroundColor: awayColor ?? NEUTRAL_COLOR,
          }}
        >
          {inline || awayPct === 0 ? (
            <span className="sr-only">{awayPct}%</span>
          ) : (
            `${awayPct}%`
          )}
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
