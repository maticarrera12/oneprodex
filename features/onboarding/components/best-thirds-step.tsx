"use client"

import { useMemo, useState, useTransition } from "react"
import type { ThirdPlaceTeam } from "@/features/onboarding/types"
import { cn } from "@/lib/utils"

type BestThirdsStepProps = {
  teams: ThirdPlaceTeam[]
  initialSelected: string[] | null
  onContinue: (formData: FormData) => Promise<void>
}

const MAX_SELECTED = 8

export function BestThirdsStep({ teams, initialSelected, onContinue }: BestThirdsStepProps) {
  const [selected, setSelected] = useState<string[]>(initialSelected ?? [])
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const selectedSet = useMemo(() => new Set(selected), [selected])
  const canSubmit = selected.length === MAX_SELECTED

  function toggleTeam(teamCode: string) {
    setSelected((current) => {
      const set = new Set(current)
      if (set.has(teamCode)) {
        set.delete(teamCode)
        return [...set]
      }
      if (set.size >= MAX_SELECTED) return current
      set.add(teamCode)
      return [...set]
    })
  }

  function handleContinue() {
    if (!canSubmit) return
    setError(null)
    const formData = new FormData()
    formData.set("team_codes", JSON.stringify(selected))

    startTransition(async () => {
      try {
        await onContinue(formData)
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "No se pudo guardar la selección de terceros.")
      }
    })
  }

  return (
    <section className="space-y-3 rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi) p-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Paso 2 · Mejores terceros</h2>
          <p className="text-xs text-(--color-text3)">Seleccioná exactamente 8 de los 12 terceros.</p>
        </div>
        <span
          className={cn(
            "rounded-full border px-2 py-1 text-xs",
            canSubmit
              ? "border-primary/40 bg-primary/15 text-primary"
              : "border-(--color-border-hi) bg-(--color-bg2) text-(--color-text2)"
          )}
        >
          {selected.length}/8
        </span>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        {teams.map((team) => {
          const picked = selectedSet.has(team.team_code)
          const blocked = !picked && selected.length >= MAX_SELECTED
          return (
            <button
              key={`${team.group_code}-${team.team_code}`}
              type="button"
              onClick={() => toggleTeam(team.team_code)}
              disabled={blocked}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-2 py-2 text-left transition",
                picked && "border-primary/45 bg-primary/15 text-primary",
                !picked && "border-(--color-border-hi) bg-(--color-bg2) text-foreground",
                blocked && "cursor-not-allowed opacity-55"
              )}
            >
              {team.logo ? (
                <img src={team.logo} alt={team.name} className="size-6 rounded-full object-cover" />
              ) : (
                <span className="inline-flex size-6 items-center justify-center rounded-full bg-(--color-card-hi) text-[10px] font-semibold">
                  {team.team_code.slice(0, 2)}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{team.name}</p>
                <p className="text-[11px] text-(--color-text3)">Grupo {team.group_code}</p>
              </div>
            </button>
          )
        })}
      </div>

      {error ? (
        <p className="rounded-lg border border-red-400/40 bg-red-500/10 px-2 py-1.5 text-xs text-red-300">{error}</p>
      ) : null}

      <button
        type="button"
        disabled={!canSubmit || isPending}
        onClick={handleContinue}
        className={cn(
          "w-full rounded-xl py-3 text-sm font-semibold transition",
          canSubmit && !isPending
            ? "bg-primary text-primary-foreground"
            : "bg-(--color-border-hi) text-(--color-text3)"
        )}
      >
        {isPending ? "Guardando..." : "Confirmar y continuar"}
      </button>
    </section>
  )
}
