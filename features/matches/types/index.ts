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
  homeLogo?: string | null
  awayLogo?: string | null
  homeC1?: string | null
  awayC1?: string | null
  hs: number | null
  as: number | null
  pred: Prediction | null
  status: MatchStatus
  minute: number | null
  kickoff: string
  stage: string
  venue?: string
}

export interface MatchPoints {
  exact: boolean
  winner: boolean
  pts: number
}
