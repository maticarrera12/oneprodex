export type MatchStatus = "LIVE" | "UPCOMING" | "FINISHED"

export interface Team {
  code: string
  name: string
  c1: string
  c2: string
  c3: string
}

export interface Prediction {
  hs: number
  as: number
}

export interface Match {
  id: string
  home: string
  away: string
  hs: number | null
  as: number | null
  pred: Prediction | null
  status: MatchStatus
  minute: number | null
  kickoff: string
  stage: string
}

export interface MatchPoints {
  exact: boolean
  winner: boolean
  pts: number
}
