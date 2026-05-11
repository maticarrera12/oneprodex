import Link from "next/link"

export function BracketHeader() {
  return (
    <header className="grid grid-cols-[40px_1fr_40px] items-center gap-3">
      <Link
        href="/"
        className="inline-flex size-10 items-center justify-center rounded-xl border border-(--color-border-hi) bg-(--color-card-hi)"
      >
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path
            d="M10 3 5 8l5 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
      <div className="text-center">
        <h1 className="text-base font-semibold">Eliminatorias</h1>
        <p className="font-mono text-[10px] text-(--color-text3)">Octavos · en vivo</p>
      </div>
      <span className="inline-flex size-10 items-center justify-center rounded-xl border border-(--color-border-hi) bg-(--color-card-hi)">
        <svg width="16" height="16" viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M8 5v3l2 1" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>
    </header>
  )
}
