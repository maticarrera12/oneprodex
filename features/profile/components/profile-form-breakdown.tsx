type ProfileFormBreakdownProps = {
  values: number[]
}

export function ProfileFormBreakdown({ values }: ProfileFormBreakdownProps) {
  const exact = values.filter((value) => value === 5).length
  const result = values.filter((value) => value === 2).length
  const missed = values.filter((value) => value === 0).length

  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold tracking-wider text-(--color-text2) uppercase">Form · last 7 matches</h2>
      <div className="rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi) p-4">
        <div className="mb-3 flex h-20 items-end gap-1.5">
          {values.map((value, index) => (
            <div key={index} className="flex flex-1 flex-col items-center gap-1">
              <span
                className={`w-full min-h-1 rounded-t-sm ${
                  value === 5
                    ? "bg-linear-to-b from-(--color-lime-hi) to-(--color-lime-deep) shadow-[0_0_8px_rgba(190,242,100,0.35)]"
                    : value === 2
                      ? "bg-white/20"
                      : "bg-white/8"
                }`}
                style={{ height: `${(value / 5) * 100}%` }}
              />
              <span className="font-mono text-[9px] text-(--color-text3)">{value}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <SmallStat n={exact} label="Exact" toneClass="text-(--color-lime-hi)" />
          <SmallStat n={result} label="Result only" toneClass="text-(--color-amber)" />
          <SmallStat n={missed} label="Missed" toneClass="text-(--color-text3)" />
        </div>
      </div>
    </section>
  )
}

function SmallStat({ n, label, toneClass }: { n: number; label: string; toneClass: string }) {
  return (
    <div className="text-center">
      <p className={`font-mono text-2xl font-semibold leading-none ${toneClass}`}>{n}</p>
      <p className="mt-1 font-mono text-[10px] tracking-wider text-(--color-text3) uppercase">{label}</p>
    </div>
  )
}
