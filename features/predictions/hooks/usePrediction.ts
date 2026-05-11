'use client'

import { useOptimistic, useTransition } from 'react'
import {
  savePrediction,
  toggleScorerPrediction,
  toggleCardPrediction,
  toggleCleanSheetPrediction,
} from '@/features/predictions/actions'
import type { MatchPredictionState } from '@/features/predictions/types'
import { MAX_SCORERS, MAX_YELLOW_CARDS, MAX_RED_CARDS } from '@/features/predictions/types'

type OptimisticState = {
  homeTeamCode: string
  awayTeamCode: string
  scorerIds: number[]
  yellowCardIds: number[]
  redCardIds: number[]
  cleanSheetCodes: string[]
  score: { home_score: number; away_score: number } | null
}

type OptimisticAction =
  | { type: 'TOGGLE_SCORER'; apiId: number }
  | { type: 'TOGGLE_YELLOW_CARD'; apiId: number }
  | { type: 'TOGGLE_RED_CARD'; apiId: number }
  | { type: 'TOGGLE_CLEAN_SHEET'; teamCode: string }
  | { type: 'SET_SCORE'; home: number; away: number }

function optimisticReducer(state: OptimisticState, action: OptimisticAction): OptimisticState {
  switch (action.type) {
    case 'TOGGLE_SCORER': {
      const next = state.scorerIds.includes(action.apiId)
        ? state.scorerIds.filter((id) => id !== action.apiId)
        : state.scorerIds.length < MAX_SCORERS
          ? [...state.scorerIds, action.apiId]
          : state.scorerIds
      return { ...state, scorerIds: next }
    }
    case 'TOGGLE_YELLOW_CARD': {
      const next = state.yellowCardIds.includes(action.apiId)
        ? state.yellowCardIds.filter((id) => id !== action.apiId)
        : state.yellowCardIds.length < MAX_YELLOW_CARDS
          ? [...state.yellowCardIds, action.apiId]
          : state.yellowCardIds
      return { ...state, yellowCardIds: next }
    }
    case 'TOGGLE_RED_CARD': {
      const next = state.redCardIds.includes(action.apiId)
        ? state.redCardIds.filter((id) => id !== action.apiId)
        : state.redCardIds.length < MAX_RED_CARDS
          ? [...state.redCardIds, action.apiId]
          : state.redCardIds
      return { ...state, redCardIds: next }
    }
    case 'TOGGLE_CLEAN_SHEET': {
      return state
    }
    case 'SET_SCORE': {
      const score = { home_score: action.home, away_score: action.away }
      const cleanSheetCodes: string[] = []
      if (score.away_score === 0) cleanSheetCodes.push(state.homeTeamCode)
      if (score.home_score === 0) cleanSheetCodes.push(state.awayTeamCode)
      return { ...state, score, cleanSheetCodes }
    }
  }
}

export function usePrediction(
  initial: MatchPredictionState,
  matchId: string,
  isLocked: boolean,
  homeTeamCode: string,
  awayTeamCode: string,
) {
  const [, startTransition] = useTransition()

  const [optimistic, dispatchOptimistic] = useOptimistic<OptimisticState, OptimisticAction>(
    {
      homeTeamCode,
      awayTeamCode,
      scorerIds: initial.scorerIds,
      yellowCardIds: initial.yellowCardIds,
      redCardIds: initial.redCardIds,
      cleanSheetCodes: initial.cleanSheetCodes,
      score: initial.score,
    },
    optimisticReducer,
  )

  function toggleScorer(apiId: number) {
    if (isLocked) return
    startTransition(() => {
      dispatchOptimistic({ type: 'TOGGLE_SCORER', apiId })
      void (async () => {
        const fd = new FormData()
        fd.set('match_id', matchId)
        fd.set('player_api_id', String(apiId))
        await toggleScorerPrediction(fd)
      })()
    })
  }

  function toggleYellowCard(apiId: number) {
    if (isLocked) return
    startTransition(() => {
      dispatchOptimistic({ type: 'TOGGLE_YELLOW_CARD', apiId })
      void (async () => {
        const fd = new FormData()
        fd.set('match_id', matchId)
        fd.set('player_api_id', String(apiId))
        fd.set('type', 'YELLOW_CARD')
        await toggleCardPrediction(fd)
      })()
    })
  }

  function toggleRedCard(apiId: number) {
    if (isLocked) return
    startTransition(() => {
      dispatchOptimistic({ type: 'TOGGLE_RED_CARD', apiId })
      void (async () => {
        const fd = new FormData()
        fd.set('match_id', matchId)
        fd.set('player_api_id', String(apiId))
        fd.set('type', 'RED_CARD')
        await toggleCardPrediction(fd)
      })()
    })
  }

  function toggleCleanSheet(teamCode: string) {
    if (isLocked) return
    startTransition(() => {
      dispatchOptimistic({ type: 'TOGGLE_CLEAN_SHEET', teamCode })
      void (async () => {
        const fd = new FormData()
        fd.set('match_id', matchId)
        fd.set('team_code', teamCode)
        await toggleCleanSheetPrediction(fd)
      })()
    })
  }

  function handleScoreSubmit(home: number, away: number) {
    if (isLocked) return
    startTransition(() => {
      dispatchOptimistic({ type: 'SET_SCORE', home, away })
      void (async () => {
        const fd = new FormData()
        fd.set('match_id', matchId)
        fd.set('home_score', String(home))
        fd.set('away_score', String(away))
        await savePrediction(fd)
      })()
    })
  }

  return { optimistic, toggleScorer, toggleYellowCard, toggleRedCard, toggleCleanSheet, handleScoreSubmit }
}
