export interface BracketMatch {
  id: string
  a: string
  b: string
  logoA: string | null
  logoB: string | null
  sa: number | null
  sb: number | null
  done: boolean
  kickoff: string | null
  pen: boolean
  sap: number | null
  sbp: number | null
}

export interface BracketRound {
  id: string
  title: string
  matches: BracketMatch[]
  wide?: boolean
  short?: boolean
  final?: boolean
}

export interface BracketScoreStat {
  label: string
  got: string
  pts: string
  hot?: boolean
}
