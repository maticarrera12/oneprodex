type ProfileFormBreakdownProps = {
  values: number[]
}

export function ProfileFormBreakdown({ values }: ProfileFormBreakdownProps) {
  const exact = values.filter((v) => v === 5).length
  const result = values.filter((v) => v === 2).length
  const missed = values.filter((v) => v === 0).length

  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold tracking-wider text-(--color-text2) uppercase">
        Form · Últimos 7 Partidos
      </h2>
      <div className="rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi) p-4">
        <div className="mb-4 flex items-center justify-between gap-2">
          {values.map((value, index) => (
            <FormCircle key={index} value={value} />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <FormStat n={exact} label="Exactos" toneClass="text-(--color-primary)" />
          <FormStat n={result} label="Solo Resultado" toneClass="text-(--color-amber)" />
          <FormStat n={missed} label="Fallados" toneClass="text-(--color-text3)" />
        </div>
      </div>
    </section>
  )
}

function FormCircle({ value }: { value: number }) {
  if (value === 5) {
    return (
      <span className="inline-flex size-12 items-center justify-center rounded-full border-2 border-(--color-primary) bg-(--color-lime-bg) text-(--color-primary)">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M4 10 8.5 14.5 16 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    )
  }
  if (value === 2) {
    return (
      <span className="inline-flex size-12 items-center justify-center rounded-full border-2 border-(--color-amber) bg-(--color-amber)/10 text-(--color-amber)">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M5 10h10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </span>
    )
  }
  return (
    <span className="inline-flex size-12 items-center justify-center rounded-full border-2 border-white/20 bg-white/6 text-(--color-text3)">
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
