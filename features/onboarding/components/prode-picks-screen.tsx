"use client"

import { useEffect, useRef, useState } from "react"
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
const AUTOSAVE_DELAY_MS = 600

type SaveStatus = "idle" | "saving" | "saved" | "error"

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
        aria-label={`Restar gol ${label}`}
      >
        −
      </button>
      <span className="w-6 text-center font-mono text-base font-semibold">{value}</span>
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
        aria-label={`Sumar gol ${label}`}
      >
        +
      </button>
    </div>
  )
}

function MatchRow({
  item,
  onSave,
  onSaved,
}: {
  item: MatchWithPrediction
  onSave: (formData: FormData) => Promise<void>
  onSaved: () => void
}) {
  const router = useRouter()
  const [home, setHome] = useState(item.prediction?.home_score ?? 0)
  const [away, setAway] = useState(item.prediction?.away_score ?? 0)
  const [status, setStatus] = useState<SaveStatus>(item.prediction ? "saved" : "idle")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSaving = useRef(false)

  function scheduleAutoSave(nextHome: number, nextAway: number) {
    if (timerRef.current) clearTimeout(timerRef.current)
    setStatus("idle")
    timerRef.current = setTimeout(async () => {
      if (isSaving.current) return
      isSaving.current = true
      setStatus("saving")
      const formData = new FormData()
      formData.set("match_id", item.match.id)
      formData.set("home_score", String(nextHome))
      formData.set("away_score", String(nextAway))
      try {
        await onSave(formData)
        setStatus("saved")
        setErrorMsg(null)
        onSaved()
        router.refresh()
      } catch (cause) {
        const msg = cause instanceof Error ? cause.message : "Error al guardar."
        setStatus("error")
        setErrorMsg(
          msg.toLowerCase().includes("locked") || msg.toLowerCase().includes("already")
            ? "El resultado ya fue guardado y no se puede cambiar."
            : msg
        )
      } finally {
        isSaving.current = false
      }
    }, AUTOSAVE_DELAY_MS)
  }

  // Cleanup timer on unmount
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  function handleHome(v: number) {
    setHome(v)
    scheduleAutoSave(v, away)
  }

  function handleAway(v: number) {
    setAway(v)
    scheduleAutoSave(home, v)
  }

  const isPredicted = status === "saved"
  const isBusy = status === "saving"

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border p-2.5 transition",
        isPredicted
          ? "border-primary/30 bg-primary/5"
          : "border-(--color-border-hi) bg-(--color-bg2)"
      )}
    >
      <span className="w-14 truncate text-right text-xs font-semibold">{item.match.home_team_code}</span>

      <div className="flex flex-1 items-center justify-center gap-2">
        <ScoreInput label={item.match.home_team_code} value={home} onChange={handleHome} disabled={isBusy} />
        <span className="text-xs font-bold text-(--color-text3)">-</span>
        <ScoreInput label={item.match.away_team_code} value={away} onChange={handleAway} disabled={isBusy} />
      </div>

      <span className="w-14 truncate text-xs font-semibold">{item.match.away_team_code}</span>

      <div className="w-5 text-center text-sm">
        {isBusy && <span className="text-(--color-text3)">·</span>}
        {isPredicted && !isBusy && <span className="text-primary">✓</span>}
        {status === "error" && <span className="text-red-400">!</span>}
      </div>

      {errorMsg && (
        <p className="col-span-full mt-1 text-[10px] text-red-400">{errorMsg}</p>
      )}
    </div>
  )
}

export function ProdePicksScreen({ matchesByGroup, filled, total, onSave }: ProdePicksScreenProps) {
  const [localFilled, setLocalFilled] = useState(filled)
  const progressPct = total > 0 ? Math.round((localFilled / total) * 100) : 0

  return (
    <section className="space-y-4 rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi) p-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Predecí los partidos</h2>
          <p className="mt-0.5 text-xs text-(--color-text3)">
            {localFilled} de {total} partidos completados
          </p>
        </div>
        <span
          className={cn(
            "rounded-full border px-2 py-1 text-xs font-semibold",
            localFilled === total
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
                  <MatchRow
                    key={item.match.id}
                    item={item}
                    onSave={onSave}
                    onSaved={() => setLocalFilled((n) => n + 1)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
