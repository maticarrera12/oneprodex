import type { RankingEntry } from "@/features/rankings/types"

export const LEADERBOARD: RankingEntry[] = [
  { rank: 1, handle: "@lucho10",   name: "Lucho Pérez",    color: "#6CCFF6", pts: 58, hits: 4, acc: 74, streak: 5, delta:  1, isYou: false },
  { rank: 2, handle: "@mariaball", name: "María Acosta",   color: "#FFD166", pts: 55, hits: 3, acc: 71, streak: 4, delta: -1, isYou: false },
  { rank: 3, handle: "@nico",      name: "Nicolás Vega",   color: "#8E7CFF", pts: 53, hits: 3, acc: 69, streak: 2, delta:  0, isYou: false },
  { rank: 4, handle: "@vos",       name: "Vos",            color: "#84CC16", pts: 51, hits: 3, acc: 68, streak: 3, delta:  2, isYou: true  },
  { rank: 5, handle: "@fede",      name: "Federico Díaz",  color: "#FB7185", pts: 48, hits: 3, acc: 65, streak: 1, delta: -1, isYou: false },
  { rank: 6, handle: "@yani",      name: "Yanina Flores",  color: "#60A5FA", pts: 46, hits: 2, acc: 63, streak: 0, delta:  1, isYou: false },
  { rank: 7, handle: "@pipo",      name: "Pipo Cano",      color: "#F59E0B", pts: 44, hits: 2, acc: 61, streak: 2, delta: -2, isYou: false },
  { rank: 8, handle: "@lila",      name: "Lila Gómez",     color: "#22D3EE", pts: 40, hits: 2, acc: 58, streak: 1, delta:  0, isYou: false },
]
