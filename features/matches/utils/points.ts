import type { Match, MatchPoints } from "../types"

export function calcPoints(match: Match): MatchPoints | null {
  if (match.status !== "FINISHED" || !match.pred || match.hs === null || match.as === null) return null

  const exact = match.pred.hs === match.hs && match.pred.as === match.as
  const actualWinner = match.hs > match.as ? "home" : match.as > match.hs ? "away" : "draw"
  const predWinner = match.pred.hs > match.pred.as ? "home" : match.pred.as > match.pred.hs ? "away" : "draw"
  const winner = !exact && actualWinner === predWinner

  return { exact, winner, pts: exact ? 5 : winner ? 2 : 0 }
}
