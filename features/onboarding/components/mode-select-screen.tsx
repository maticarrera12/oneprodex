"use client"

import { useState, useTransition } from "react"
import { cn } from "@/lib/utils"

type ModeSelectScreenProps = {
  onSelect: (formData: FormData) => Promise<void>
}

type ModeOption = {
  value: "prode" | "quick"
  title: string
  description: string
  notice: string | null
  highlighted: boolean
}

const MODES: ModeOption[] = [
  {
    value: "prode",
    title: "Prode Tradicional",
    description: "Predecí el resultado de cada partido de la fase de grupos.",
    notice: "Podés predecir sin completar todos los partidos",
    highlighted: true,
  },
  {
    value: "quick",
    title: "Modo Rápido",
    description: "Ordená los grupos directamente y armá tu bracket.",
    notice: null,
    highlighted: false,
  },
]

export function ModeSelectScreen({ onSelect }: ModeSelectScreenProps) {
  const [selected, setSelected] = useState<"prode" | "quick" | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSelect(mode: "prode" | "quick") {
    setSelected(mode)
    setError(null)

    const formData = new FormData()
    formData.set("mode", mode)

    startTransition(async () => {
      try {
        await onSelect(formData)
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "No se pudo guardar el modo.")
      }
    })
  }

  return (
    <section className="space-y-4 rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi) p-4">
      <div>
        <h2 className="text-base font-semibold">Elegí tu modo de juego</h2>
        <p className="mt-1 text-xs text-(--color-text3)">Seleccioná cómo querés participar en el prode.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {MODES.map((mode) => (
          <button
            key={mode.value}
            type="button"
            disabled={isPending}
            onClick={() => handleSelect(mode.value)}
            className={cn(
              "relative flex flex-col gap-2 rounded-xl border p-4 text-left transition",
              mode.highlighted
                ? "border-primary/45 bg-primary/10"
                : "border-(--color-border-hi) bg-(--color-bg2)",
              selected === mode.value && "ring-2 ring-primary ring-offset-1",
              isPending && "opacity-60"
            )}
          >
            {mode.highlighted && (
              <span className="absolute right-3 top-3 rounded-full border border-primary/30 bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                Recomendado
              </span>
            )}
            <p className="pr-16 text-sm font-semibold">{mode.title}</p>
            <p className="text-xs text-(--color-text2)">{mode.description}</p>
            {mode.notice && (
              <p className="mt-0.5 rounded-lg border border-(--color-border-hi) bg-(--color-bg2) px-2 py-1 text-xs text-(--color-text3)">
                {mode.notice}
              </p>
            )}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-lg border border-red-400/40 bg-red-500/10 px-2 py-1.5 text-xs text-red-300">{error}</p>
      )}
    </section>
  )
}
