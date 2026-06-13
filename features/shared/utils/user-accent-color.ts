const ACCENT_COLORS = ["#84cc16", "#60a5fa", "#a78bfa", "#f472b6", "#fb923c", "#2dd4bf", "#facc15", "#f87171"]

export function userAccentColor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  return ACCENT_COLORS[Math.abs(hash) % ACCENT_COLORS.length]!
}
