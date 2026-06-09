"use client"

import { useState } from "react"
import { motion } from "framer-motion"

import { BracketChampionCard } from "@/features/bracket/components/bracket-champion-card"
import { BracketHeader } from "@/features/bracket/components/bracket-header"
import { BracketMatchCard } from "@/features/bracket/components/bracket-match-card"
import { BracketRoundColumn } from "@/features/bracket/components/bracket-round-column"
import { BracketScoreCard } from "@/features/bracket/components/bracket-score-card"
import { BracketViewTabs, type BracketViewTab } from "@/features/bracket/components/bracket-view-tabs"
import type { BracketRound, BracketScoreStat } from "@/features/bracket/types"

const CARD_HEIGHT = 110
const BASE_GAP = 12

type BracketScreenProps = {
  rounds: BracketRound[]
  actualRounds: BracketRound[]
  scoreStats: BracketScoreStat[]
  champion: {
    code: string
    name: string
    logo: string | null
    subtitle: string
  }
  readOnly?: boolean
}

function computeHalfPositions(basePositions: number[], halfRounds: BracketRound[]): number[][] {
  return halfRounds.map((round, roundIndex) => {
    if (roundIndex === 0) return basePositions

    let prev = basePositions
    for (let i = 1; i <= roundIndex; i++) {
      const count = halfRounds[i]?.matches.length ?? 0
      if (count <= 0) return []
      const chunkSize = Math.max(1, Math.floor(prev.length / count))
      prev = Array.from({ length: count }, (_, idx) => {
        const start = idx * chunkSize
        const end = Math.min(start + chunkSize - 1, prev.length - 1)
        return (prev[start] + prev[end]) / 2
      })
    }

    return prev
  })
}

export function BracketScreen({ rounds, actualRounds, scoreStats, champion, readOnly = false }: BracketScreenProps) {
  const [tab, setTab] = useState<BracketViewTab>("Mis picks")

  const activeRounds = tab === "Actual" ? actualRounds : rounds
  const mainRounds = activeRounds.filter((r) => r.id !== "third" && r.id !== "final")
  const thirdRound = activeRounds.find((r) => r.id === "third")
  const finalRound = activeRounds.find((r) => r.id === "final")

  // Split each main round in half: left = first half, right = second half
  const leftRounds: BracketRound[] = mainRounds.map((round) => {
    const half = Math.ceil(round.matches.length / 2)
    return { ...round, matches: round.matches.slice(0, half) }
  })

  const rightRounds: BracketRound[] = mainRounds.map((round) => {
    const half = Math.ceil(round.matches.length / 2)
    return { ...round, matches: round.matches.slice(half) }
  })

  // Base positions derived from the left first-round count (= 8 for a 16-team R32)
  const leftFirstCount = leftRounds[0]?.matches.length ?? 0
  const basePositions = Array.from({ length: leftFirstCount }, (_, i) => i * (CARD_HEIGHT + BASE_GAP))
  const columnHeight = leftFirstCount > 0 ? basePositions[leftFirstCount - 1] + CARD_HEIGHT : CARD_HEIGHT

  const leftPositions = computeHalfPositions(basePositions, leftRounds)
  const rightPositions = computeHalfPositions(basePositions, rightRounds)

  // sfTop: vertical center of the single SF-left match (last round of left side)
  const lastLeftPositions = leftPositions[leftPositions.length - 1] ?? []
  const sfTop = lastLeftPositions[0] ?? 0

  return (
    <div className="space-y-4 py-4 pb-6">
      <BracketHeader />
      {readOnly ? (
        <div className="rounded-xl border border-primary/35 bg-primary/10 px-3 py-2 text-center text-xs text-primary">
          Bracket enviado · solo lectura
        </div>
      ) : null}
      <BracketViewTabs active={tab} onChange={setTab} />
      {tab === "Actual" ? (
        <div className="rounded-xl border border-(--color-border-hi) bg-(--color-bg2)/80 px-3 py-2.5 text-center text-xs leading-relaxed text-muted-foreground">
          Los partidos aparecerán acá cuando se fijen los cruces del torneo.
        </div>
      ) : null}
      <BracketChampionCard champion={champion} />
      <BracketShareButton />

      <div className="scrollbar-none -mx-4 overflow-x-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex min-w-max items-start gap-3.5 pr-1"
        >
          {/* Left side: R32→SF converging toward center */}
          {leftRounds.map((round, index) => (
            <BracketRoundColumn
              key={`left-${round.id}`}
              round={round}
              positions={leftPositions[index] ?? []}
              columnHeight={columnHeight}
            />
          ))}

          {/* Center: Final + Third place */}
          {finalRound && (
            <section className="w-[220px] shrink-0">
              <h3 className="mb-2 px-1 font-mono text-[10px] uppercase tracking-wider text-(--color-text3)">
                {finalRound.title}
              </h3>
              <div className="relative" style={{ height: columnHeight }}>
                {/* Final */}
                <div className="absolute inset-x-0" style={{ top: sfTop }}>
                  <BracketMatchCard match={finalRound.matches[0]} final />
                </div>
                {/* Third place */}
                {thirdRound?.matches[0] && (
                  <div className="absolute inset-x-0" style={{ top: sfTop + CARD_HEIGHT + 24 }}>
                    <p className="mb-1.5 px-1 font-mono text-[10px] uppercase tracking-wider text-(--color-text3)">
                      {thirdRound.title}
                    </p>
                    <BracketMatchCard match={thirdRound.matches[0]} final={false} />
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Right side: SF→R32 diverging from center (columns reversed) */}
          {[...rightRounds].reverse().map((round, i) => {
            const originalIndex = rightRounds.length - 1 - i
            return (
              <BracketRoundColumn
                key={`right-${round.id}`}
                round={round}
                positions={rightPositions[originalIndex] ?? []}
                columnHeight={columnHeight}
              />
            )
          })}
        </motion.div>
      </div>

      <BracketScoreCard stats={scoreStats} />
    </div>
  )
}

function fireSharAchievement() {
  fetch('/api/achievements/share-bracket', { method: 'POST' }).catch(() => {})
}

function BracketShareButton() {
  const handleCopy = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // clipboard not available — ignore
    }
    fireSharAchievement()
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ url, title: 'Mi bracket' })
      } catch {
        // user cancelled or share failed — ignore
      }
      fireSharAchievement()
    } else {
      await handleCopy()
    }
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={handleCopy}
        className="flex-1 rounded-xl border border-(--color-border-hi) bg-(--color-card-hi) py-2.5 text-center font-mono text-xs font-semibold uppercase tracking-wider text-(--color-text2)"
      >
        Copiar link
      </button>
      <button
        type="button"
        onClick={handleShare}
        className="flex-1 rounded-xl border border-(--color-border-hi) bg-(--color-card-hi) py-2.5 text-center font-mono text-xs font-semibold uppercase tracking-wider text-(--color-text2)"
      >
        Compartir
      </button>
    </div>
  )
}
