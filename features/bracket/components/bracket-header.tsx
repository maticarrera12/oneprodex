"use client"

import Link from "next/link"

function triggerShareAchievement() {
  fetch("/api/achievements/share-bracket", { method: "POST" }).catch(() => {})
}

export function BracketHeader() {
  const handleShare = async () => {
    const url = window.location.href
    triggerShareAchievement()

    if (navigator.share) {
      await navigator.share({ title: "Mi bracket", url }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(url).catch(() => {})
    }
  }

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
      <button
        type="button"
        onClick={handleShare}
        aria-label="Compartir bracket"
        className="inline-flex size-10 items-center justify-center rounded-xl border border-(--color-border-hi) bg-(--color-card-hi)"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="12" cy="3" r="1.8" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="12" cy="13" r="1.8" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="4" cy="8" r="1.8" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5.7 7.1 10.3 4.4M5.7 8.9l4.6 2.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </header>
  )
}
