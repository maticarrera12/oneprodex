type GroupTrendProps = {
  delta: number
}

export function GroupTrend({ delta }: GroupTrendProps) {
  if (delta === 0) {
    return <span className="inline-flex size-3 rounded-[3px] bg-(--color-text4)" />
  }

  const up = delta > 0

  return (
    <span className={`inline-flex items-center gap-1 font-mono text-[11px] font-semibold ${up ? "text-(--color-primary)" : "text-red-400"}`}>
      <svg width="9" height="9" viewBox="0 0 9 9" style={{ transform: up ? "none" : "rotate(180deg)" }}>
        <path d="M4.5 1 8 6H1L4.5 1Z" fill="currentColor" />
      </svg>
      {Math.abs(delta)}
    </span>
  )
}
