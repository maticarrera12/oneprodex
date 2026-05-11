import { Flag } from "@/features/home/components/flag"

type BracketChampionCardProps = {
  champion: {
    code: string
    name: string
    subtitle: string
  }
}

export function BracketChampionCard({ champion }: BracketChampionCardProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi) p-4">
      <span className="pointer-events-none absolute -top-8 -right-8 size-32 rounded-full bg-(--color-lime-mid) opacity-15 blur-3xl" />
      <div className="relative flex items-center gap-3">
        <span className="inline-flex size-11 items-center justify-center rounded-xl bg-linear-to-br from-(--color-lime-hi) to-(--color-lime-deep)">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M6 4h12v3a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V4Z" stroke="#0A0A0C" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M6 4H4v2a3 3 0 0 0 2 3M18 4h2v2a3 3 0 0 1-2 3" stroke="#0A0A0C" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M9 11v3l-1 4h8l-1-4v-3" stroke="#0A0A0C" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-wider text-(--color-lime-hi)">Tu campeón</p>
          <p className="text-lg font-bold">{champion.name}</p>
          <p className="text-sm text-(--color-text2)">{champion.subtitle}</p>
        </div>
        <Flag code={champion.code} size={44} />
      </div>
    </section>
  )
}
