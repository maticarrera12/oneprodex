"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import type { AwardsSelection } from "@/features/onboarding/types"
import { cn } from "@/lib/utils"

type PlayerOption = {
  api_id: number
  name: string
  photo_url: string | null
  team_code: string | null
}

type AwardsStepProps = {
  initialSelection: AwardsSelection | null
  onContinue: (formData: FormData) => Promise<void>
}

type FieldState = {
  query: string
  selected: PlayerOption | null
  results: PlayerOption[]
}

async function searchPlayersApi(query: string, youngOnly = false): Promise<PlayerOption[]> {
  const params = new URLSearchParams({ q: query })
  if (youngOnly) params.set("young", "1")
  const response = await fetch(`/api/players/search?${params.toString()}`, { method: "GET" })
  if (!response.ok) return []
  const payload = (await response.json()) as { data?: PlayerOption[] }
  return payload.data ?? []
}

type PlayerSearchFieldProps = {
  title: string
  placeholder: string
  state: FieldState
  pending: boolean
  onQueryChange: (query: string) => void
  onSelect: (player: PlayerOption) => void
  onClear: () => void
}

function PlayerSearchField({ title, placeholder, state, pending, onQueryChange, onSelect, onClear }: PlayerSearchFieldProps) {
  const showDropdown = state.query.trim().length >= 2 && !state.selected

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-(--color-text2)">{title}</p>
      <div className="relative">
        {state.selected ? (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-primary/35 bg-primary/10 px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              {state.selected.photo_url ? (
                <img src={state.selected.photo_url} alt={state.selected.name} className="size-6 rounded-full object-cover" />
              ) : (
                <span className="inline-flex size-6 items-center justify-center rounded-full bg-(--color-card-hi) text-[10px] font-semibold">
                  {state.selected.name.slice(0, 2).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{state.selected.name}</p>
                <p className="text-[11px] text-(--color-text3)">{state.selected.team_code ?? "Sin equipo"}</p>
              </div>
            </div>
            <button type="button" onClick={onClear} className="shrink-0 text-xs text-(--color-text3) hover:text-foreground">✕</button>
          </div>
        ) : (
          <input
            value={state.query}
            onChange={(event) => onQueryChange(event.currentTarget.value)}
            placeholder={placeholder}
            className="w-full rounded-xl border border-(--color-border-hi) bg-(--color-bg2) px-3 py-2 text-sm outline-none"
          />
        )}

        {showDropdown ? (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-(--color-border-hi) bg-(--color-bg2) shadow-lg">
            {pending ? (
              <p className="px-3 py-2 text-xs text-(--color-text3)">Buscando...</p>
            ) : state.results.length === 0 ? (
              <p className="px-3 py-2 text-xs text-(--color-text3)">Sin resultados</p>
            ) : (
              state.results.map((player) => (
                <button
                  key={player.api_id}
                  type="button"
                  onClick={() => onSelect(player)}
                  className="flex w-full items-center gap-2 border-b border-(--color-border-hi) px-3 py-2 text-left text-sm last:border-b-0 hover:bg-(--color-card-hi)"
                >
                  {player.photo_url ? (
                    <img src={player.photo_url} alt={player.name} className="size-6 rounded-full object-cover" />
                  ) : (
                    <span className="inline-flex size-6 items-center justify-center rounded-full bg-(--color-card-hi) text-[10px] font-semibold">
                      {player.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <span className="truncate">{player.name}</span>
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function AwardsStep({ initialSelection, onContinue }: AwardsStepProps) {
  const [topScorer, setTopScorer] = useState<FieldState>({ query: "", selected: null, results: [] })
  const [bestPlayer, setBestPlayer] = useState<FieldState>({ query: "", selected: null, results: [] })
  const [bestYoungPlayer, setBestYoungPlayer] = useState<FieldState>({ query: "", selected: null, results: [] })
  const [searchPending, startSearchTransition] = useTransition()
  const [submitPending, startSubmitTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!initialSelection) return
    const hydrate = (id: number | null, setter: (next: FieldState) => void) => {
      if (!id) return
      setter({ query: String(id), selected: { api_id: id, name: `Jugador #${id}`, photo_url: null, team_code: null }, results: [] })
    }
    hydrate(initialSelection.top_scorer_api_id, setTopScorer)
    hydrate(initialSelection.best_player_api_id, setBestPlayer)
    hydrate(initialSelection.best_young_player_api_id, setBestYoungPlayer)
  }, [initialSelection])

  useEffect(() => {
    const value = topScorer.query.trim()
    if (value.length < 2) {
      setTopScorer((current) => ({ ...current, results: [] }))
      return
    }
    const timer = setTimeout(() => {
      startSearchTransition(async () => {
        const results = await searchPlayersApi(value, false)
        setTopScorer((current) => (current.query.trim() === value ? { ...current, results } : current))
      })
    }, 250)
    return () => clearTimeout(timer)
  }, [topScorer.query])

  useEffect(() => {
    const value = bestPlayer.query.trim()
    if (value.length < 2) {
      setBestPlayer((current) => ({ ...current, results: [] }))
      return
    }
    const timer = setTimeout(() => {
      startSearchTransition(async () => {
        const results = await searchPlayersApi(value, false)
        setBestPlayer((current) => (current.query.trim() === value ? { ...current, results } : current))
      })
    }, 250)
    return () => clearTimeout(timer)
  }, [bestPlayer.query])

  useEffect(() => {
    const value = bestYoungPlayer.query.trim()
    if (value.length < 2) {
      setBestYoungPlayer((current) => ({ ...current, results: [] }))
      return
    }
    const timer = setTimeout(() => {
      startSearchTransition(async () => {
        const results = await searchPlayersApi(value, true)
        setBestYoungPlayer((current) => (current.query.trim() === value ? { ...current, results } : current))
      })
    }, 250)
    return () => clearTimeout(timer)
  }, [bestYoungPlayer.query])

  const canSubmit = useMemo(
    () => Boolean(topScorer.selected && bestPlayer.selected && bestYoungPlayer.selected),
    [bestPlayer.selected, bestYoungPlayer.selected, topScorer.selected]
  )

  function handleSubmit() {
    if (!canSubmit || !topScorer.selected || !bestPlayer.selected || !bestYoungPlayer.selected) return
    setError(null)
    const formData = new FormData()
    formData.set("top_scorer_api_id", String(topScorer.selected.api_id))
    formData.set("best_player_api_id", String(bestPlayer.selected.api_id))
    formData.set("best_young_player_api_id", String(bestYoungPlayer.selected.api_id))

    startSubmitTransition(async () => {
      try {
        await onContinue(formData)
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "No se pudo enviar el onboarding.")
      }
    })
  }

  return (
    <section className="space-y-3 rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi) p-3">
      <div>
        <h2 className="text-sm font-semibold">Paso 4 · Premios del torneo</h2>
        <p className="text-xs text-(--color-text3)">Elegí goleador, mejor jugador y mejor jugador joven.</p>
      </div>

      <PlayerSearchField
        title="Goleador"
        placeholder="Buscar jugador..."
        state={topScorer}
        pending={searchPending}
        onQueryChange={(query) => setTopScorer((current) => ({ ...current, query, selected: null }))}
        onSelect={(player) => setTopScorer({ query: player.name, selected: player, results: [] })}
        onClear={() => setTopScorer({ query: "", selected: null, results: [] })}
      />

      <PlayerSearchField
        title="Mejor jugador"
        placeholder="Buscar jugador..."
        state={bestPlayer}
        pending={searchPending}
        onQueryChange={(query) => setBestPlayer((current) => ({ ...current, query, selected: null }))}
        onSelect={(player) => setBestPlayer({ query: player.name, selected: player, results: [] })}
        onClear={() => setBestPlayer({ query: "", selected: null, results: [] })}
      />

      <PlayerSearchField
        title="Mejor jugador joven"
        placeholder="Buscar jugador joven..."
        state={bestYoungPlayer}
        pending={searchPending}
        onQueryChange={(query) => setBestYoungPlayer((current) => ({ ...current, query, selected: null }))}
        onSelect={(player) => setBestYoungPlayer({ query: player.name, selected: player, results: [] })}
        onClear={() => setBestYoungPlayer({ query: "", selected: null, results: [] })}
      />

      {error ? (
        <p className="rounded-lg border border-red-400/40 bg-red-500/10 px-2 py-1.5 text-xs text-red-300">{error}</p>
      ) : null}

      <button
        type="button"
        disabled={!canSubmit || submitPending}
        onClick={handleSubmit}
        className={cn(
          "w-full rounded-xl py-3 text-sm font-semibold transition",
          canSubmit && !submitPending
            ? "bg-primary text-primary-foreground"
            : "bg-(--color-border-hi) text-(--color-text3)"
        )}
      >
        {submitPending ? "Enviando..." : "Confirmar y enviar"}
      </button>
    </section>
  )
}
