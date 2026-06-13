export interface RankingEntry {
  rank: number
  handle: string
  name: string
  color: string
  avatarUrl?: string | null
  pts: number
  hits: number
  acc: number
  streak: number
  delta: number
  isYou: boolean
}
