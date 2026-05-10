type TrendProps = {
  delta: number
}

export function Trend({ delta }: TrendProps) {
  if (delta > 0) {
    return <span className="text-primary">{"\u2191"}{Math.abs(delta)}</span>
  }

  if (delta < 0) {
    return <span className="text-(--color-amber)">{"\u2193"}{Math.abs(delta)}</span>
  }

  return <span className="text-muted-foreground">{"\u2013"}0</span>
}
