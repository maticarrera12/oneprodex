export type GroupCode = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L'

export type GroupRankings = Record<GroupCode, [string, string, string, string]>

export type SlotId =
  | 'R32_P1'
  | 'R32_P2'
  | 'R32_P3'
  | 'R32_P4'
  | 'R32_P5'
  | 'R32_P6'
  | 'R32_P7'
  | 'R32_P8'
  | 'R32_P9'
  | 'R32_P10'
  | 'R32_P11'
  | 'R32_P12'
  | 'R32_P13'
  | 'R32_P14'
  | 'R32_P15'
  | 'R32_P16'
  | 'R16_P1'
  | 'R16_P2'
  | 'R16_P3'
  | 'R16_P4'
  | 'R16_P5'
  | 'R16_P6'
  | 'R16_P7'
  | 'R16_P8'
  | 'QF_P1'
  | 'QF_P2'
  | 'QF_P3'
  | 'QF_P4'
  | 'SF_P1'
  | 'SF_P2'
  | 'THIRD'
  | 'FINAL'

export interface BracketPick {
  slot: SlotId
  team_code: string
}

export interface OnboardingTeam {
  code: string
  name: string
  logo: string | null
}

export interface ThirdPlaceTeam {
  group_code: GroupCode
  team_code: string
  name: string
  logo: string | null
}

export interface AwardsSelection {
  top_scorer_api_id: number | null
  best_player_api_id: number | null
  best_young_player_api_id: number | null
}

export type OnboardingStep =
  | { status: 'complete' }
  | { status: 'mode_select' }
  | { status: 'prode_picks'; filled: number; total: number }
  | { status: 'bracket' }
  | { status: 'awards' }
  | { status: 'quick_step'; step: 1 | 2 | 3 | 4 }

export interface OnboardingState {
  step: OnboardingStep
  groupRankings: GroupRankings | null
  bestThirds: string[] | null
  bracketPicks: BracketPick[] | null
  tournamentPredictions: AwardsSelection | null
}
