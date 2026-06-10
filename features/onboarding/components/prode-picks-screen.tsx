"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import type { GroupCode } from "@/features/onboarding/types"

export type GroupStageMatch = {
  id: string
  home_team_code: string
  away_team_code: string
  group_code: GroupCode
  kickoff: string
}

export type MatchWithPrediction = {
  match: GroupStageMatch
  prediction: { home_score: number; away_score: number } | null
}

type ProdePicksScreenProps = {
  matchesByGroup: Partial<Record<GroupCode, MatchWithPrediction[]>>
  filled: number
  total: number
  onSave: (formData: FormData) => Promise<void>
}

const ALL_GROUPS: GroupCode[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]

type ScoreState = { home: number; away: number }

type MatchSaveState = {
  status: "idle" | "saving" | "saved" | "error"
  error: string | null
}

function ScoreInput({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  disabled: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] text-(--color-text3)">{label}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={disabled || value <= 0}
          onClick={() => onChange(Math.max(0, value - 1))}
          className={cn(
            "inline-flex size-7 items-center justify-center rounded-lg border text-sm font-semibold transition",
            disabled || value <= 0
              ? "border-(--color-border-hi) text-(--color-text4) opacity-40"
              : "border-(--color-border-hi) bg-(--color-bg2) text-(--color-text2) hover:bg-(--color-card-hi)"
          )}
        >
          −
        </button>
        <span className="w-7 text-center font-mono text-base font-semibold">{value}</span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(value + 1)}
          className={cn(
            "inline-flex size-7 items-center justify-center rounded-lg border text-sm font-semibold transition",
            disabled
              ? "border-(--color-border-hi) text-(--color-text4) opacity-40"
              : "border-(--color-border-hi) bg-(--color-bg2) text-(--color-text2) hover:bg-(--color-card-hi)"
          )}
        >
          +
        </button>
      </div>
    </div>
  )
}

function MatchRow({
  item,
  onSave,
}: {
  item: MatchWithPrediction
  onSave: (formData: FormData) => Promise<void>
}) {
  const router = useRouter()
  const [score, setScore] = useState<ScoreState>({
    home: item.prediction?.home_score ?? 0,
    away: item.prediction?.away_score ?? 0,
  })
  const [saveState, setSaveState] = useState<MatchSaveState>({
    status: item.prediction ? "saved" : "idle",
    error: null,
  })
  const [isPending, startTransition] = useTransition()

  const isPredicted = saveState.status === "saved"

  function handleSave() {
    setSaveState({ status: "saving", error: null })
    const formData = new FormData()
    formData.set("match_id", item.match.id)
    formData.set("home_score", String(score.home))
    formData.set("away_score", String(score.away))

    startTransition(async () => {
      try {
        await onSave(formData)
        setSaveState({ status: "saved", error: null })
        router.refresh()
      } catch (cause) {
        const msg = cause instanceof Error ? cause.message : "Error al guardar."
        if (msg.toLowerCase().includes("locked") || msg.toLowerCase().includes("already")) {
          setSaveState({ status: "error", error: "El resultado ya fue guardado y no se puede cambiar." })
        } else {
          setSaveState({ status: "error", error: msg })
        }
      }
    })
  }

  return (
    <div
      className={cn(
        "grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2 rounded-xl border p-2.5 transition",
        isPredicted
          ? "border-primary/30 bg-primary/5"
          : "border-(--color-border-hi) bg-(--color-bg2)"
      )}
    >
      <div className="flex items-center gap-2">
        <span className="truncate text-xs font-semibold">{item.match.home_team_code}</span>
      </div>

      <div className="flex items-center gap-2">
        <ScoreInput
          label={item.match.home_team_code}
          value={score.home}
          onChange={(v) => {
            setScore((s) => ({ ...s, home: v }))
            if (saveState.status === "saved") setSaveState({ status: "idle", error: null })
          }}
          disabled={isPending}
        />
        <span className="text-xs text-(--color-text3)">-</span>
        <ScoreInput
          label={item.match.away_team_code}
          value={score.away}
          onChange={(v) => {
            setScore((s) => ({ ...s, away: v }))
            if (saveState.status === "saved") setSaveState({ status: "idle", error: null })
          }}
          disabled={isPending}
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        <span className="truncate text-xs font-semibold">{item.match.away_team_code}</span>
      </div>

      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          disabled={isPending || saveState.status === "saving"}
          onClick={handleSave}
          className={cn(
            "rounded-lg border px-2.5 py-1 text-xs font-semibold transition",
            isPredicted
              ? "border-primary/30 bg-primary/15 text-primary"
              : "border-(--color-border-hi) bg-(--color-bg2) text-(--color-text2) hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
          )}
        >
          {isPending ? "..." : isPredicted ? "✓" : "Guardar"}
        </button>
        {saveState.error && (
          <p className="text-right text-[10px] text-red-400">{saveState.error}</p>
        )}
      </div>
    </div>
  )
}

export function ProdePicksScreen({ matchesByGroup, filled, total, onSave }: ProdePicksScreenProps) {
  const progressPct = total > 0 ? Math.round((filled / total) * 100) : 0

  return (
    <section className="space-y-4 rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi) p-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Predecí los partidos</h2>
          <p className="mt-0.5 text-xs text-(--color-text3)">
            {filled} de {total} partidos completados
          </p>
        </div>
        <span
          className={cn(
            "rounded-full border px-2 py-1 text-xs font-semibold",
            filled === total
              ? "border-primary/30 bg-primary/15 text-primary"
              : "border-(--color-border-hi) bg-(--color-bg2) text-(--color-text2)"
          )}
        >
          {progressPct}%
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-(--color-border-hi)">
        <div className="h-1.5 bg-(--color-bg2)">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {ALL_GROUPS.map((group) => {
          const matches = matchesByGroup[group]
          if (!matches || matches.length === 0) return null
          return (
            <div key={group} className="space-y-2">
              <p className="text-xs font-semibold text-(--color-text2)">Grupo {group}</p>
              <div className="space-y-1.5">
                {matches.map((item) => (
                  <MatchRow key={item.match.id} item={item} onSave={onSave} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
