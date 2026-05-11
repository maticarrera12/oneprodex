export const MAX_SCORERS = 3
export const MAX_YELLOW_CARDS = 2
export const MAX_RED_CARDS = 1

export interface ScorePrediction {
  home_score: number
  away_score: number
}

export interface PlayerPrediction {
  player_api_id: number
  type: 'SCORER' | 'YELLOW_CARD' | 'RED_CARD'
}

export interface MatchPredictionState {
  score: ScorePrediction | null
  scorerIds: number[]
  yellowCardIds: number[]
  redCardIds: number[]
  cleanSheetCodes: string[]
}

export interface TournamentPrediction {
  champion_code: string | null
  top_scorer_api_id: number | null
  best_player_api_id: number | null
  best_young_player_api_id: number | null
}

export interface PlayerDetail {
  api_id: number
  name: string
  position: string | null
  photo_url: string | null
}

export interface MatchEvent {
  id: string
  match_id: string
  type: string
  player_api_id: number | null
  team_code: string | null
  minute: number | null
}
