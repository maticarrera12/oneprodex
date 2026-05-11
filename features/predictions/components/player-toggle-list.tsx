'use client'

import type { PlayerDetail } from '@/features/predictions/types'

type PlayerToggleListProps = {
  title: string
  players: PlayerDetail[]
  isLocked: boolean
  selectedIds?: number[]
  onToggle?: (apiId: number) => void
  maxPicks?: number
  yellowSelectedIds?: number[]
  redSelectedIds?: number[]
  onToggleYellow?: (apiId: number) => void
  onToggleRed?: (apiId: number) => void
}

export function PlayerToggleList({
  title,
  players,
  isLocked,
  selectedIds,
  onToggle,
  maxPicks,
  yellowSelectedIds,
  redSelectedIds,
  onToggleYellow,
  onToggleRed,
}: PlayerToggleListProps) {
  const isCardMode = yellowSelectedIds !== undefined || redSelectedIds !== undefined

  const displayTitle =
    maxPicks !== undefined && selectedIds !== undefined
      ? `${title} (${selectedIds.length}/${maxPicks})`
      : title

  return (
    <div className="rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi) p-4">
      <p className="mb-3 font-mono text-[11px] tracking-wider text-(--color-text3) uppercase">{displayTitle}</p>
      {players.length === 0 ? (
        <p className="text-xs text-(--color-text3) py-2">Plantillas no disponibles aún</p>
      ) : isCardMode ? (
        <div className="flex flex-col gap-1">
          {players.map((player) => {
            const yellowSelected = (yellowSelectedIds ?? []).includes(player.api_id)
            const redSelected = (redSelectedIds ?? []).includes(player.api_id)
            return (
              <div key={player.api_id} className="flex items-center justify-between gap-2">
                <p className="text-xs text-(--color-text2) flex-1 truncate">{player.name}</p>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => onToggleYellow?.(player.api_id)}
                    className={`rounded border px-2 py-0.5 text-[11px] font-mono font-semibold transition ${
                      yellowSelected
                        ? 'bg-(--color-amber)/20 text-(--color-amber) border-(--color-amber)/40'
                        : 'border-(--color-border-hi) bg-(--color-bg2) text-(--color-text3)'
                    } ${isLocked ? 'opacity-60' : ''}`}
                  >
                    A
                  </button>
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => onToggleRed?.(player.api_id)}
                    className={`rounded border px-2 py-0.5 text-[11px] font-mono font-semibold transition ${
                      redSelected
                        ? 'bg-red-500/20 text-red-400 border-red-500/40'
                        : 'border-(--color-border-hi) bg-(--color-bg2) text-(--color-text3)'
                    } ${isLocked ? 'opacity-60' : ''}`}
                  >
                    R
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {players.map((player) => {
            const selected = (selectedIds ?? []).includes(player.api_id)
            return (
              <button
                key={player.api_id}
                type="button"
                disabled={isLocked}
                onClick={() => onToggle?.(player.api_id)}
                className={`rounded-full border px-2.5 py-1 text-xs transition ${
                  selected
                    ? 'border-(--color-lime-deep) bg-(--color-lime-bg) text-(--color-lime-hi)'
                    : 'border-(--color-border-hi) bg-(--color-bg2) text-(--color-text2)'
                } ${isLocked ? 'opacity-60' : ''}`}
              >
                {player.name}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
