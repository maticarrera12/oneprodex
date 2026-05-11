"use client"

import { useState } from "react"
import { motion } from "framer-motion"

import { BracketChampionCard } from "@/features/bracket/components/bracket-champion-card"
import { BracketHeader } from "@/features/bracket/components/bracket-header"
import { BracketRoundColumn } from "@/features/bracket/components/bracket-round-column"
import { BracketScoreCard } from "@/features/bracket/components/bracket-score-card"
import { BracketViewTabs, type BracketViewTab } from "@/features/bracket/components/bracket-view-tabs"
import type { BracketRound, BracketScoreStat } from "@/features/bracket/types"

type BracketScreenProps = {
  rounds: BracketRound[]
  scoreStats: BracketScoreStat[]
  champion: {
    code: string
    name: string
    subtitle: string
  }
}

export function BracketScreen({ rounds, scoreStats, champion }: BracketScreenProps) {
  const [tab, setTab] = useState<BracketViewTab>("Mis picks")
  const cardHeight = 110
  const baseGap = 12
  const firstRoundCount = rounds[0]?.matches.length ?? 0
  const firstRoundPositions = Array.from({ length: firstRoundCount }, (_, index) => index * (cardHeight + baseGap))
  const columnHeight = firstRoundCount > 0 ? firstRoundPositions[firstRoundCount - 1] + cardHeight : cardHeight

  const positionsByRound: number[][] = rounds.map((round, roundIndex) => {
    if (roundIndex === 0) return firstRoundPositions
    const prevPositions = positionsByRoundFrom(firstRoundPositions, rounds, roundIndex - 1)
    const nextCount = round.matches.length
    const chunkSize = Math.max(1, Math.floor(prevPositions.length / Math.max(1, nextCount)))

    return Array.from({ length: nextCount }, (_, index) => {
      const start = index * chunkSize
      const end = Math.min(start + chunkSize - 1, prevPositions.length - 1)
      return (prevPositions[start] + prevPositions[end]) / 2
    })
  })

  return (
    <div className="space-y-4 py-4 pb-6">
      <BracketHeader />
      <BracketViewTabs active={tab} onChange={setTab} />
      <BracketChampionCard champion={champion} />

      <div className="scrollbar-none -mx-4 overflow-x-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex min-w-max items-stretch gap-3.5 pr-1"
        >
          {rounds.map((round, index) => (
            <BracketRoundColumn
              key={round.id}
              round={round}
              positions={positionsByRound[index] ?? []}
              columnHeight={columnHeight}
            />
          ))}
        </motion.div>
      </div>

      <BracketScoreCard stats={scoreStats} />
    </div>
  )
}

function positionsByRoundFrom(firstRoundPositions: number[], rounds: BracketRound[], targetRoundIndex: number): number[] {
  if (targetRoundIndex === 0) return firstRoundPositions

  let prev = firstRoundPositions

  for (let roundIndex = 1; roundIndex <= targetRoundIndex; roundIndex++) {
    const count = rounds[roundIndex]?.matches.length ?? 0
    if (count <= 0) return []

    const chunkSize = Math.max(1, Math.floor(prev.length / count))
    const next = Array.from({ length: count }, (_, index) => {
      const start = index * chunkSize
      const end = Math.min(start + chunkSize - 1, prev.length - 1)
      return (prev[start] + prev[end]) / 2
    })
    prev = next
  }

  return prev
}
