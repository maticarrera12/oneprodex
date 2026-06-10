"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Flag } from "@/features/home/components/flag"
import { formatDayHeading, formatKickoffParts, getKickoffDayKey, parseKickoff } from "@/features/matches/utils/kickoff"
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
  onSaveAndExit: () => Promise<void>
  logoByCode?: Map<string, string>
}

const ALL_GROUPS: GroupCode[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]
const AUTOSAVE_DELAY_MS = 600

type SaveStatus = "idle" | "saving" | "saved" | "error"

type ProdeDayGroup = {
  dayKey: string
  dayLabel: string
  items: MatchWithPrediction[]
}

function TeamLogo({ code, logo, size = 24 }: { code: string; logo?: string; size?: number }) {
  if (logo) {
    return (
      <img
        src={logo}
        alt={code}
        width={size}
        height={size}
        className="rounded-full border border-white/20 object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.2)]"
        style={{ width: size, height: size }}
      />
    )
  }
  return <Flag code={code} size={size} />
}

function ScoreButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void
  disabled: boolean
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      className={cn(
        "inline-flex size-6 items-center justify-center rounded-md border text-sm font-semibold transition",
        disabled
          ? "border-border/40 text-muted-foreground/40"
          : "border-border/80 bg-card/90 text-foreground hover:bg-white/10"
      )}
    >
      {children}
    </button>
  )
}

function MatchRow({
  item,
  onSave,
  onSaved,
  logoByCode,
}: {
  item: MatchWithPrediction
  onSave: (formData: FormData) => Promise<void>
  onSaved: () => void
  logoByCode?: Map<string, string>
}) {
  const router = useRouter()
  const [home, setHome] = useState<number | null>(item.prediction?.home_score ?? null)
  const [away, setAway] = useState<number | null>(item.prediction?.away_score ?? null)
  const [status, setStatus] = useState<SaveStatus>(item.prediction ? "saved" : "idle")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSaving = useRef(false)
  const hadPrediction = useRef(Boolean(item.prediction))
  const kickoff = formatKickoffParts(item.match.kickoff)

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
        if (!hadPrediction.current) {
          onSaved()
          hadPrediction.current = true
        }
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

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const isBusy = status === "saving"
  const isPredicted = status === "saved"

  function updateScore(nextHome: number | null, nextAway: number | null) {
    setHome(nextHome)
    setAway(nextAway)
    if (nextHome !== null && nextAway !== null) {
      scheduleAutoSave(nextHome, nextAway)
    }
  }

  function displayScore(value: number | null) {
    return value === null ? "-" : value
  }

  return (
    <article
      className={cn(
        "rounded-xl border px-3.5 py-3 transition",
        isPredicted
          ? "border-l-2 border-primary/40 bg-primary/5"
          : "border-border/80 border-l-2 border-l-primary"
      )}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2 gap-y-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <TeamLogo code={item.match.home_team_code} logo={logoByCode?.get(item.match.home_team_code)} size={24} />
          <span className="text-sm font-semibold">{item.match.home_team_code}</span>
        </div>

        <div className="flex items-center justify-center gap-1 sm:gap-1.5">
          <ScoreButton
            disabled={isBusy || home === null || home <= 0}
            onClick={() => updateScore(Math.max(0, (home ?? 0) - 1), away)}
            label="Restar gol local"
          >−</ScoreButton>
          <span className="w-5 text-center font-mono text-base font-semibold">{displayScore(home)}</span>
          <ScoreButton
            disabled={isBusy}
            onClick={() => updateScore(home === null ? 0 : home + 1, away)}
            label="Sumar gol local"
          >+</ScoreButton>

          <span className="mx-0.5 font-mono text-sm font-bold text-muted-foreground">–</span>

          <ScoreButton
            disabled={isBusy || away === null || away <= 0}
            onClick={() => updateScore(home, Math.max(0, (away ?? 0) - 1))}
            label="Restar gol visitante"
          >−</ScoreButton>
          <span className="w-5 text-center font-mono text-base font-semibold">{displayScore(away)}</span>
          <ScoreButton
            disabled={isBusy}
            onClick={() => updateScore(home, away === null ? 0 : away + 1)}
            label="Sumar gol visitante"
          >+</ScoreButton>
        </div>

        <div className="flex min-w-0 items-center justify-end gap-1.5">
          <span className="truncate text-sm font-semibold">{item.match.away_team_code}</span>
          <TeamLogo code={item.match.away_team_code} logo={logoByCode?.get(item.match.away_team_code)} size={24} />
        </div>

        <div className="col-span-3 flex items-center justify-between border-t border-border/40 pt-2">
          <p className="font-mono text-[10px] text-(--color-text3)">Kickoff · {kickoff.time}</p>
          <div className="w-4 text-center text-sm">
            {isBusy && <span className="text-muted-foreground">·</span>}
            {isPredicted && !isBusy && <span className="text-primary">✓</span>}
            {status === "error" && <span className="text-red-400">!</span>}
          </div>
        </div>
      </div>

      {errorMsg && (
        <p className="mt-1.5 text-[10px] text-red-400">{errorMsg}</p>
      )}
    </article>
  )
}

function groupProdeMatchesByDay(items: MatchWithPrediction[]): ProdeDayGroup[] {
  const sorted = [...items].sort((a, b) => {
    const aTime = parseKickoff(a.match.kickoff)?.getTime() ?? 0
    const bTime = parseKickoff(b.match.kickoff)?.getTime() ?? 0
    return aTime - bTime
  })
  const map = new Map<string, ProdeDayGroup>()

  for (const item of sorted) {
    const dayKey = getKickoffDayKey(item.match.kickoff)
    const existing = map.get(dayKey)
    if (existing) {
      existing.items.push(item)
    } else {
      map.set(dayKey, {
        dayKey,
        dayLabel: formatDayHeading(item.match.kickoff),
        items: [item],
      })
    }
  }

  return Array.from(map.values())
}

export function ProdePicksScreen({ matchesByGroup, filled, total, onSave, onSaveAndExit, logoByCode }: ProdePicksScreenProps) {
  const [localFilled, setLocalFilled] = useState(filled)
  const [exitPending, setExitPending] = useState(false)
  const [exitError, setExitError] = useState<string | null>(null)
  const progressPct = total > 0 ? Math.round((localFilled / total) * 100) : 0

  async function handleSaveAndExit() {
    setExitPending(true)
    setExitError(null)
    try {
      await onSaveAndExit()
      window.location.assign(`/onboarding?continue=${Date.now()}`)
    } catch (cause) {
      setExitPending(false)
      setExitError(cause instanceof Error ? cause.message : "No se pudo avanzar.")
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi) p-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Predecí los partidos</h2>
          <p className="mt-0.5 text-xs text-(--color-text3)">
            {localFilled} de {total} completados · Podés seguir antes de que arranque cada partido
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

      <div className="space-y-8">
        {ALL_GROUPS.map((group) => {
          const matches = matchesByGroup[group]
          if (!matches || matches.length === 0) return null
          const dayGroups = groupProdeMatchesByDay(matches)
          return (
            <section key={group} className="space-y-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Grupo {group}
              </p>
              <div className="space-y-4">
                {dayGroups.map((day) => (
                  <section key={`${group}-${day.dayKey}`} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-(--color-border-hi)" />
                      <p className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-primary">
                        {day.dayLabel}
                      </p>
                      <div className="h-px flex-1 bg-(--color-border-hi)" />
                    </div>
                    <div className="space-y-2">
                      {day.items.map((item) => (
                        <MatchRow
                          key={item.match.id}
                          item={item}
                          onSave={onSave}
                          onSaved={() => setLocalFilled((n) => n + 1)}
                          logoByCode={logoByCode}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </section>
          )
        })}
      </div>

      <div className="border-t border-(--color-border-hi) pt-4">
        <p className="mb-3 text-center text-xs text-muted-foreground">
          Resultado exacto = 5 pts · Solo ganador/empate = 2 pts
        </p>
        <button
          type="button"
          disabled={exitPending}
          onClick={handleSaveAndExit}
          className="w-full rounded-xl bg-(--color-bg2) border border-(--color-border-hi) px-4 py-2.5 text-sm font-semibold text-(--color-text2) transition hover:bg-(--color-card-hi) disabled:opacity-60"
        >
          {exitPending ? "Guardando..." : "Guardar y salir"}
        </button>
        {exitError ? <p className="mt-2 text-center text-xs text-red-400">{exitError}</p> : null}
      </div>
    </section>
  )
}
