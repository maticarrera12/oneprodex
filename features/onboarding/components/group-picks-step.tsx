"use client"

import { useMemo, useState, useTransition } from "react"
import type { GroupCode, GroupRankings, OnboardingTeam } from "@/features/onboarding/types"
import { cn } from "@/lib/utils"

type GroupPicksStepProps = {
  teamsByGroup: Record<GroupCode, OnboardingTeam[]>
  initialRankings: GroupRankings | null
  onContinue: (formData: FormData) => Promise<void>
}

const GROUPS: GroupCode[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]

function buildInitialRankings(
  teamsByGroup: Record<GroupCode, OnboardingTeam[]>,
  initialRankings: GroupRankings | null
): Record<GroupCode, string[]> {
  if (initialRankings) {
    return GROUPS.reduce(
      (acc, group) => {
        acc[group] = [...initialRankings[group]]
        return acc
      },
      {} as Record<GroupCode, string[]>
    )
  }

  return GROUPS.reduce(
    (acc, group) => {
      acc[group] = teamsByGroup[group].slice(0, 4).map((team) => team.code)
      return acc
    },
    {} as Record<GroupCode, string[]>
  )
}

export function GroupPicksStep({ teamsByGroup, initialRankings, onContinue }: GroupPicksStepProps) {
  const [rankings, setRankings] = useState<Record<GroupCode, string[]>>(() =>
    buildInitialRankings(teamsByGroup, initialRankings)
  )
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const completedGroups = useMemo(
    () =>
      GROUPS.filter((group) => {
        const picks = rankings[group] ?? []
        return picks.length === 4 && new Set(picks).size === 4
      }).length,
    [rankings]
  )
  const canSubmit = completedGroups === GROUPS.length

  function moveTeam(group: GroupCode, fromIndex: number, toIndex: number) {
    setRankings((current) => {
      const next = [...(current[group] ?? [])]
      const [moved] = next.splice(fromIndex, 1)
      if (!moved) return current
      next.splice(toIndex, 0, moved)
      return {
        ...current,
        [group]: next,
      }
    })
  }

  function handleContinue() {
    if (!canSubmit) return
    setError(null)

    const picks = GROUPS.flatMap((group) =>
      (rankings[group] ?? []).map((teamCode, index) => ({
        group_code: group,
        position: index + 1,
        team_code: teamCode,
      }))
    )

    if (picks.length !== 48) {
      setError("Completá los 12 grupos con 4 equipos cada uno.")
      return
    }

    const formData = new FormData()
    formData.set("picks", JSON.stringify(picks))

    startTransition(async () => {
      try {
        await onContinue(formData)
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "No se pudo guardar la fase de grupos.")
      }
    })
  }

  return (
    <section className="space-y-3 rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi) p-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Paso 1 · Ordená cada grupo</h2>
          <p className="text-xs text-(--color-text3)">Tap para mover arriba/abajo y definir 1° a 4°.</p>
        </div>
        <span className="rounded-full border border-(--color-border-hi) bg-(--color-bg2) px-2 py-1 text-xs text-(--color-text2)">
          {completedGroups}/12
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {GROUPS.map((group) => {
          const orderedCodes = rankings[group] ?? []
          const teamsByCode = new Map(teamsByGroup[group].map((team) => [team.code, team] as const))

          return (
            <div key={group} className="rounded-xl border border-(--color-border-hi) bg-(--color-bg2) p-2">
              <p className="mb-2 text-xs font-semibold text-(--color-text2)">Grupo {group}</p>
              <div className="space-y-1.5">
                {orderedCodes.map((teamCode, index) => {
                  const team = teamsByCode.get(teamCode)
                  const canMoveUp = index > 0
                  const canMoveDown = index < orderedCodes.length - 1
                  return (
                    <div
                      key={teamCode}
                      className="grid grid-cols-[26px_1fr_auto] items-center gap-2 rounded-lg border border-(--color-border-hi) bg-background px-2 py-1.5"
                    >
                      <span className="inline-flex size-6 items-center justify-center rounded-full border border-primary/40 bg-primary/15 text-xs font-semibold text-primary">
                        {index + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        {team?.logo ? (
                          <img src={team.logo} alt={team.name} className="size-5 rounded-full object-cover" />
                        ) : (
                          <span className="inline-flex size-5 items-center justify-center rounded-full bg-(--color-card-hi) text-[10px] font-semibold">
                            {teamCode.slice(0, 2)}
                          </span>
                        )}
                        <span className="truncate text-sm">{team?.name ?? teamCode}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={!canMoveUp}
                          onClick={() => moveTeam(group, index, index - 1)}
                          className={cn(
                            "inline-flex size-6 items-center justify-center rounded-md border text-xs",
                            canMoveUp
                              ? "border-(--color-border-hi) bg-(--color-card-hi) text-foreground"
                              : "border-(--color-border-hi) bg-(--color-card-hi) text-(--color-text4) opacity-50"
                          )}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          disabled={!canMoveDown}
                          onClick={() => moveTeam(group, index, index + 1)}
                          className={cn(
                            "inline-flex size-6 items-center justify-center rounded-md border text-xs",
                            canMoveDown
                              ? "border-(--color-border-hi) bg-(--color-card-hi) text-foreground"
                              : "border-(--color-border-hi) bg-(--color-card-hi) text-(--color-text4) opacity-50"
                          )}
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
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
