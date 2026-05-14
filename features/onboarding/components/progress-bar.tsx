"use client"

import { cn } from "@/lib/utils"

type ProgressBarProps = {
  currentStep: 1 | 2 | 3 | 4
}

const STEPS = [
  { id: 1, label: "Grupos" },
  { id: 2, label: "Terceros" },
  { id: 3, label: "Bracket" },
  { id: 4, label: "Premios" },
] as const

export function ProgressBar({ currentStep }: ProgressBarProps) {
  return (
    <div className="rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi) p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-mono text-[11px] tracking-wider text-(--color-text3) uppercase">Onboarding</p>
        <p className="text-xs text-(--color-text2)">
          Paso {currentStep} de {STEPS.length}
        </p>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {STEPS.map((step) => {
          const active = step.id === currentStep
          const completed = step.id < currentStep

          return (
            <div
              key={step.id}
              className={cn(
                "rounded-xl border px-2 py-2 text-center text-xs transition-colors",
                completed && "border-primary/40 bg-primary/15 text-primary",
                active && "border-primary bg-primary text-primary-foreground",
                !active && !completed && "border-(--color-border-hi) bg-(--color-bg2) text-(--color-text3)"
              )}
            >
              {step.label}
            </div>
          )
        })}
      </div>
    </div>
  )
}
