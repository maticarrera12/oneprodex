import type { ProfileHistoryKind } from "@/features/profile/types"

type ProfileFormBreakdownProps = {
  values: ProfileHistoryKind[]
}

export function ProfileFormBreakdown({ values }: ProfileFormBreakdownProps) {
  const exact = values.filter((v) => v === "exact").length
  const result = values.filter((v) => v === "result").length
  const missed = values.filter((v) => v === "miss").length

  return (
    <section className="flex h-full flex-col">
      <h2 className="mb-2 text-xs font-semibold tracking-wider text-(--color-text2) uppercase">
        Form · Últimos 7 Partidos
      </h2>
      <div className="flex flex-1 flex-col rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi) p-4">
        <div className="mb-4 flex flex-1 items-center justify-between gap-2">
          {values.length === 0 ? (
            <p className="font-mono text-xs text-(--color-text4)">Sin partidos puntuados todavía</p>
          ) : (
            values.map((kind, index) => <FormCircle key={index} kind={kind} />)
          )}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <FormStat n={exact} label="Exactos" toneClass="text-(--color-primary)" />
          <FormStat n={result} label="Solo Resultado" toneClass="text-(--color-amber)" />
          <FormStat n={missed} label="Fallados" toneClass="text-red-400" />
        </div>
      </div>
    </section>
  )
}

function FormCircle({ kind }: { kind: ProfileHistoryKind }) {
  if (kind === "exact") {
    return (
      <span className="inline-flex size-12 items-center justify-center rounded-full border-2 border-(--color-primary) bg-(--color-lime-bg) text-(--color-primary)">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M4 10 8.5 14.5 16 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    )
  }
  if (kind === "result") {
    return (
      <span className="inline-flex size-12 items-center justify-center rounded-full border-2 border-(--color-amber) bg-(--color-amber)/10 text-(--color-amber)">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M5 10h10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </span>
    )
  }
  return (
    <span className="inline-flex size-12 items-center justify-center rounded-full border-2 border-red-400/70 bg-red-400/10 text-red-400">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    </span>
  )
}

function FormStat({ n, label, toneClass }: { n: number; label: string; toneClass: string }) {
  return (
    <div className="text-center">
      <p className={`font-mono text-2xl font-semibold leading-none ${toneClass}`}>{n}</p>
      <p className="mt-1 font-mono text-[9px] tracking-wider text-(--color-text3) uppercase">{label}</p>
    </div>
  )
}
