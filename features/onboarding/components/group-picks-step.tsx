"use client"

import { useMemo, useState, useTransition, type DragEvent } from "react"
import type { GroupCode, GroupRankings, OnboardingTeam } from "@/features/onboarding/types"
import { cn } from "@/lib/utils"

type GroupPicksStepProps = {
  groups: GroupCode[]
  teamsByGroup: Record<GroupCode, OnboardingTeam[]>
  initialRankings: GroupRankings | null
  onContinue: (formData: FormData) => Promise<void>
}

function buildInitialRankings(
  groups: GroupCode[],
  teamsByGroup: Record<GroupCode, OnboardingTeam[]>,
  initialRankings: GroupRankings | null
): Record<GroupCode, string[]> {
  if (initialRankings) {
    return groups.reduce(
      (acc, group) => {
        acc[group] = [...initialRankings[group]]
        return acc
      },
      {} as Record<GroupCode, string[]>
    )
  }

  return groups.reduce(
    (acc, group) => {
      acc[group] = teamsByGroup[group].slice(0, 4).map((team) => team.code)
      return acc
    },
    {} as Record<GroupCode, string[]>
  )
}

export function GroupPicksStep({ groups, teamsByGroup, initialRankings, onContinue }: GroupPicksStepProps) {
  const [rankings, setRankings] = useState<Record<GroupCode, string[]>>(() =>
    buildInitialRankings(groups, teamsByGroup, initialRankings)
  )
  const [dragging, setDragging] = useState<{ group: GroupCode; index: number } | null>(null)
  const [dragOver, setDragOver] = useState<{ group: GroupCode; index: number } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const completedGroups = useMemo(
    () =>
      groups.filter((group) => {
        const picks = rankings[group] ?? []
        return picks.length === 4 && new Set(picks).size === 4
      }).length,
    [rankings, groups]
  )
  const canSubmit = completedGroups === groups.length

  function moveTeam(group: GroupCode, fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return
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

  function handleDragStart(group: GroupCode, index: number, event: DragEvent<HTMLDivElement>) {
    setDragging({ group, index })
    setDragOver({ group, index })
    event.dataTransfer.effectAllowed = "move"
    event.dataTransfer.setData("text/plain", `${group}:${index}`)
  }

  function handleDrop(group: GroupCode, index: number) {
    if (!dragging || dragging.group !== group) {
      setDragging(null)
      setDragOver(null)
      return
    }
    moveTeam(group, dragging.index, index)
    setDragging(null)
    setDragOver(null)
  }

  function handleContinue() {
    if (!canSubmit) return
    setError(null)

    const picks = groups.flatMap((group) =>
      (rankings[group] ?? []).map((teamCode, index) => ({
        group_code: group,
        position: index + 1,
        team_code: teamCode,
      }))
    )

    if (picks.length !== groups.length * 4) {
      setError(`Completá los ${groups.length} grupos con 4 equipos cada uno.`)
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
          <p className="text-xs text-(--color-text3)">Arrastrá y soltá equipos para definir 1° a 4°.</p>
        </div>
        <span className="rounded-full border border-(--color-border-hi) bg-(--color-bg2) px-2 py-1 text-xs text-(--color-text2)">
          {completedGroups}/{groups.length}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {groups.map((group) => {
          const orderedCodes = rankings[group] ?? []
          const teamsByCode = new Map(teamsByGroup[group].map((team) => [team.code, team] as const))

          return (
            <div key={group} className="rounded-xl border border-(--color-border-hi) bg-(--color-bg2) p-2">
              <p className="mb-2 text-xs font-semibold text-(--color-text2)">Grupo {group}</p>
              <div className="space-y-1.5">
                {orderedCodes.map((teamCode, index) => {
                  const team = teamsByCode.get(teamCode)
                  const isDragging = dragging?.group === group && dragging.index === index
                  const isOver = dragOver?.group === group && dragOver.index === index
                  return (
                    <div
                      key={teamCode}
                      draggable
                      onDragStart={(event) => handleDragStart(group, index, event)}
                      onDragEnd={() => {
                        setDragging(null)
                        setDragOver(null)
                      }}
                      onDragOver={(event) => {
                        event.preventDefault()
                        if (!dragging || dragging.group !== group) return
                        setDragOver({ group, index })
                      }}
                      onDrop={(event) => {
                        event.preventDefault()
                        handleDrop(group, index)
                      }}
                      className={cn(
                        "grid cursor-grab grid-cols-[26px_1fr] items-center gap-2 rounded-lg border bg-background px-2 py-1.5 transition",
                        isOver ? "border-primary/60 ring-1 ring-primary/40" : "border-(--color-border-hi)",
                        isDragging ? "opacity-60" : "opacity-100"
                      )}
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
