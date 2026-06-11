"use client"

import { useMemo, useState, useTransition } from "react"
import { Flag } from "@/features/home/components/flag"
import type { BracketPick, GroupRankings, SlotId } from "@/features/onboarding/types"
import { resolveR32Pairs } from "@/features/onboarding/utils/slot-resolver"
import { cn } from "@/lib/utils"

type BracketStepProps = {
  groupRankings: GroupRankings
  bestThirds: string[]
  initialPicks: BracketPick[] | null
  logoByCode: Map<string, string>
  onContinue: (formData: FormData) => Promise<void>
  onBack?: () => Promise<void>
}

type RoundConfig = {
  id: "R32" | "R16" | "QF" | "SF" | "THIRD" | "FINAL"
  title: string
  size: number
}

type Match = {
  slot: SlotId
  left: string
  right: string
}

const ROUND_CONFIG: RoundConfig[] = [
  { id: "R32", title: "Ronda de 32", size: 16 },
  { id: "R16", title: "Octavos", size: 8 },
  { id: "QF", title: "Cuartos", size: 4 },
  { id: "SF", title: "Semifinal", size: 2 },
  { id: "THIRD", title: "Tercer puesto", size: 1 },
  { id: "FINAL", title: "Final", size: 1 },
]

function slotId(round: RoundConfig["id"], index: number): SlotId {
  if (round === "THIRD") return "THIRD"
  if (round === "FINAL") return "FINAL"
  return `${round}_P${index}` as SlotId
}

function buildSeededTeams(groupRankings: GroupRankings, bestThirds: string[]) {
  return resolveR32Pairs(groupRankings, bestThirds).flatMap(({ home, away }) => [home, away])
}

function buildMatches(picks: Map<SlotId, string>, groupRankings: GroupRankings, bestThirds: string[]) {
  const rounds = new Map<RoundConfig["id"], Match[]>()
  const seeded = buildSeededTeams(groupRankings, bestThirds)

  const r32: Match[] = Array.from({ length: 16 }, (_, index) => ({
    slot: slotId("R32", index + 1),
    left: seeded[index * 2] ?? "---",
    right: seeded[index * 2 + 1] ?? "---",
  }))
  rounds.set("R32", r32)

  const r16: Match[] = Array.from({ length: 8 }, (_, index) => {
    const leftWinner = picks.get(slotId("R32", index * 2 + 1)) ?? "---"
    const rightWinner = picks.get(slotId("R32", index * 2 + 2)) ?? "---"
    return { slot: slotId("R16", index + 1), left: leftWinner, right: rightWinner }
  })
  rounds.set("R16", r16)

  const qf: Match[] = Array.from({ length: 4 }, (_, index) => {
    const leftWinner = picks.get(slotId("R16", index * 2 + 1)) ?? "---"
    const rightWinner = picks.get(slotId("R16", index * 2 + 2)) ?? "---"
    return { slot: slotId("QF", index + 1), left: leftWinner, right: rightWinner }
  })
  rounds.set("QF", qf)

  const sf: Match[] = Array.from({ length: 2 }, (_, index) => {
    const leftWinner = picks.get(slotId("QF", index * 2 + 1)) ?? "---"
    const rightWinner = picks.get(slotId("QF", index * 2 + 2)) ?? "---"
    return { slot: slotId("SF", index + 1), left: leftWinner, right: rightWinner }
  })
  rounds.set("SF", sf)

  const sf1Left = picks.get("QF_P1") ?? "---"
  const sf1Right = picks.get("QF_P2") ?? "---"
  const sf2Left = picks.get("QF_P3") ?? "---"
  const sf2Right = picks.get("QF_P4") ?? "---"
  const sf1Winner = picks.get("SF_P1")
  const sf2Winner = picks.get("SF_P2")
  const sf1Loser = sf1Winner ? (sf1Winner === sf1Left ? sf1Right : sf1Left) : "---"
  const sf2Loser = sf2Winner ? (sf2Winner === sf2Left ? sf2Right : sf2Left) : "---"

  const third: Match[] = [{ slot: "THIRD", left: sf1Loser, right: sf2Loser }]
  rounds.set("THIRD", third)

  const final: Match[] = [
    {
      slot: "FINAL",
      left: picks.get(slotId("SF", 1)) ?? "---",
      right: picks.get(slotId("SF", 2)) ?? "---",
    },
  ]
  rounds.set("FINAL", final)

  return rounds
}

function clearDownstream(picks: Map<SlotId, string>, changed: SlotId) {
  const next = new Map(picks)
  if (changed.startsWith("R32_")) {
    const idx = Number(changed.split("_P")[1] ?? "1")
    const r16 = Math.ceil(idx / 2)
    next.delete(slotId("R16", r16))
    next.delete(slotId("QF", Math.ceil(r16 / 2)))
    next.delete(slotId("SF", Math.ceil(r16 / 4)))
    next.delete("THIRD")
    next.delete("FINAL")
    return next
  }
  if (changed.startsWith("R16_")) {
    const idx = Number(changed.split("_P")[1] ?? "1")
    next.delete(slotId("QF", Math.ceil(idx / 2)))
    next.delete(slotId("SF", Math.ceil(idx / 4)))
    next.delete("THIRD")
    next.delete("FINAL")
    return next
  }
  if (changed.startsWith("QF_")) {
    const idx = Number(changed.split("_P")[1] ?? "1")
    next.delete(slotId("SF", Math.ceil(idx / 2)))
    next.delete("THIRD")
    next.delete("FINAL")
    return next
  }
  if (changed.startsWith("SF_")) {
    next.delete("THIRD")
    next.delete("FINAL")
    return next
  }
  return next
}

export function BracketStep({ groupRankings, bestThirds, initialPicks, logoByCode, onContinue, onBack }: BracketStepProps) {
  const initialMap = useMemo(
    () =>
      new Map<SlotId, string>(
        (initialPicks ?? [])
          .filter((pick) => pick.slot && pick.team_code)
          .map((pick) => [pick.slot, pick.team_code] as const)
      ),
    [initialPicks]
  )
  const [picks, setPicks] = useState<Map<SlotId, string>>(initialMap)
  const [isPending, startTransition] = useTransition()
  const [isBackPending, startBackTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const matchesByRound = useMemo(() => buildMatches(picks, groupRankings, bestThirds), [bestThirds, groupRankings, picks])

  function setWinner(slot: SlotId, winner: string) {
    setPicks((current) => {
      const cleaned = clearDownstream(current, slot)
      cleaned.set(slot, winner)
      return cleaned
    })
  }

  const canSubmit = picks.size === 32

  function handleBack() {
    if (!onBack) return
    setError(null)
    startBackTransition(async () => {
      try {
        await onBack()
        window.location.assign(`/onboarding?continue=${Date.now()}`)
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "No se pudo volver atrás.")
      }
    })
  }

  function handleContinue() {
    if (!canSubmit) return
    setError(null)
    const payload = [...picks.entries()].map(([slot, team_code]) => ({ slot, team_code }))
    const formData = new FormData()
    formData.set("picks", JSON.stringify(payload))

    startTransition(async () => {
      try {
        await onContinue(formData)
        window.location.assign(`/onboarding?continue=${Date.now()}`)
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "No se pudo guardar el bracket.")
      }
    })
  }

  const mainRoundConfigs = ROUND_CONFIG.filter((r) => r.id !== "THIRD" && r.id !== "FINAL")
  const thirdConfig = ROUND_CONFIG.find((r) => r.id === "THIRD")!
  const finalConfig = ROUND_CONFIG.find((r) => r.id === "FINAL")!
  const halfBracketHeight = 8 * 122

  function renderMatchCard(match: Match) {
    const winner = picks.get(match.slot)
    const isLockedByUpstream = match.left === "---" || match.right === "---"
    return (
      <article key={match.slot} className="rounded-lg border border-(--color-border-hi) bg-background p-2">
        <p className="mb-1 font-mono text-[10px] tracking-wide text-(--color-text3)">{match.slot}</p>
        <div className="space-y-1.5">
          {[match.left, match.right].map((teamCode, teamIndex) => (
            <button
              key={`${match.slot}-${teamIndex}-${teamCode}`}
              type="button"
              disabled={teamCode === "---"}
              onClick={() => setWinner(match.slot, teamCode)}
              className={cn(
                "flex w-full items-center justify-between rounded-md border px-2 py-1.5 text-xs font-medium transition",
                winner === teamCode
                  ? "border-primary/50 bg-primary/15 text-primary"
                  : "border-(--color-border-hi) bg-(--color-card-hi) text-foreground",
                teamCode === "---" && "cursor-not-allowed opacity-45"
              )}
            >
              <span className="flex items-center gap-1.5">
                {teamCode !== "---" ? (
                  logoByCode.get(teamCode.trim().toUpperCase()) ? (
                    <img
                      src={logoByCode.get(teamCode.trim().toUpperCase())}
                      alt={teamCode}
                      className="size-4 rounded-full border border-white/20 object-cover"
                      onError={(event) => { event.currentTarget.style.display = "none" }}
                    />
                  ) : (
                    <Flag code={teamCode} size={16} />
                  )
                ) : (
                  <span className="inline-flex size-4" />
                )}
                <span>{teamCode}</span>
              </span>
              {winner === teamCode ? <span className="text-[10px]">✓</span> : null}
            </button>
          ))}
        </div>
        {isLockedByUpstream ? (
          <p className="mt-1 text-[10px] text-(--color-text4)">Completá cruces previos</p>
        ) : null}
      </article>
    )
  }

  function renderHalfColumn(round: RoundConfig, halfMatches: Match[], key: string) {
    const picked = halfMatches.filter((m) => picks.has(m.slot)).length
    return (
      <div key={key} className="w-[220px] shrink-0 rounded-xl border border-(--color-border-hi) bg-(--color-bg2) p-2">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold text-(--color-text2)">{round.title}</p>
          <span className="font-mono text-[10px] text-(--color-text3)">{picked}/{halfMatches.length}</span>
        </div>
        <div className="flex flex-col justify-around gap-2" style={{ minHeight: halfBracketHeight }}>
          {halfMatches.map(renderMatchCard)}
        </div>
      </div>
    )
  }

  return (
    <section className="space-y-3 rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi) p-3">
      {onBack ? (
        <button
          type="button"
          disabled={isBackPending || isPending}
          onClick={handleBack}
          className="text-xs font-semibold text-(--color-text3) transition hover:text-foreground disabled:opacity-50"
        >
          {isBackPending ? "Volviendo..." : "← Cambiar modo"}
        </button>
      ) : null}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Paso 3 · Armá tu bracket</h2>
          <p className="text-xs text-(--color-text3)">Elegí ganador por cruce. Cambios arriba limpian rondas siguientes.</p>
        </div>
        <span className="rounded-full border border-(--color-border-hi) bg-(--color-bg2) px-2 py-1 text-xs text-(--color-text2)">
          {picks.size}/32
        </span>
      </div>

      <div className="scrollbar-none -mx-3 overflow-x-auto px-3">
        <div className="flex min-w-max items-start gap-3 pr-1">
          {/* Left side: R32→SF */}
          {mainRoundConfigs.map((round) => {
            const all = matchesByRound.get(round.id) ?? []
            return renderHalfColumn(round, all.slice(0, Math.ceil(all.length / 2)), `left-${round.id}`)
          })}

          {/* Center: Final + Third place */}
          {(() => {
            const finalMatches = matchesByRound.get(finalConfig.id) ?? []
            const thirdMatches = matchesByRound.get(thirdConfig.id) ?? []
            return (
              <div className="w-[220px] shrink-0 rounded-xl border border-(--color-border-hi) bg-(--color-bg2) p-2">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-(--color-text2)">{finalConfig.title}</p>
                  <span className="font-mono text-[10px] text-(--color-text3)">
                    {finalMatches.filter((m) => picks.has(m.slot)).length}/{finalMatches.length}
                  </span>
                </div>
                <div className="flex flex-col gap-4" style={{ minHeight: halfBracketHeight }}>
                  <div className="flex flex-1 flex-col justify-center gap-2">
                    {finalMatches.map(renderMatchCard)}
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold text-(--color-text2)">{thirdConfig.title}</p>
                    {thirdMatches.map(renderMatchCard)}
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Right side: SF→R32 (reversed) */}
          {[...mainRoundConfigs].reverse().map((round) => {
            const all = matchesByRound.get(round.id) ?? []
            return renderHalfColumn(round, all.slice(Math.ceil(all.length / 2)), `right-${round.id}`)
          })}
        </div>
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
