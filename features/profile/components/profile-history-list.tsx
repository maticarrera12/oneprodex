"use client"

import Link from "next/link"
import { useState } from "react"
import { TeamLogo } from "@/features/shared/components/team-logo"
import type { ProfileHistoryEntry, ProfileHistoryPhase } from "@/features/profile/types"

type ProfileHistoryListProps = {
  entries: ProfileHistoryEntry[]
  /**
   * Whether this is the viewer's own profile. On a friend's profile the
   * self-referential bits change: the column header reads "Su pred." and the
   * "Ver todas mis predicciones" CTA (which links to your own /partidos) is hidden.
   */
  isOwnProfile?: boolean
}

type TabId = "todas" | ProfileHistoryPhase

const TABS: { id: TabId; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "grupos", label: "Fase de Grupos" },
  { id: "octavos", label: "Octavos" },
  { id: "cuartos", label: "Cuartos" },
  { id: "semis", label: "Semifinales" },
  { id: "final", label: "Final" },
]

export function ProfileHistoryList({ entries, isOwnProfile = true }: ProfileHistoryListProps) {
  const [activeTab, setActiveTab] = useState<TabId>("todas")

  const exact = entries.filter((e) => e.kind === "exact").length
  const result = entries.filter((e) => e.kind === "result").length
  const missed = entries.filter((e) => e.kind === "miss").length

  const filtered = activeTab === "todas" ? entries : entries.filter((e) => e.phase === activeTab)

  return (
    <section>
      <div className="mb-3 flex items-start justify-between gap-2">
        <h2 className="text-xs font-semibold tracking-wider text-(--color-text2) uppercase">
          Predicciones Realizadas
        </h2>
        <div className="flex items-center gap-2 text-[10px] font-mono shrink-0">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-(--color-primary)" />
            <span className="text-(--color-text3)">Exactos {exact}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-(--color-amber)" />
            <span className="text-(--color-text3)">Solo Resultado {result}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-red-400" />
            <span className="text-(--color-text3)">Fallados {missed}</span>
          </span>
        </div>
      </div>

      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 rounded-full px-3 py-1 font-mono text-[10px] font-semibold tracking-wide uppercase transition-colors ${
              activeTab === tab.id
                ? "bg-(--color-primary) text-black"
                : "border border-(--color-border-hi) bg-(--color-card-hi) text-(--color-text3)"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi)">
        <div className="grid grid-cols-[1fr_72px_36px_32px] items-center gap-2 border-b border-(--color-border-hi) px-3 py-2 md:grid-cols-[40px_1fr_72px_52px_36px_32px]">
          <span className="hidden font-mono text-[9px] tracking-wider text-(--color-text4) uppercase md:block">Fecha</span>
          <span className="font-mono text-[9px] tracking-wider text-(--color-text4) uppercase">Partido</span>
          <span className="font-mono text-[9px] tracking-wider text-(--color-text4) uppercase text-center">{isOwnProfile ? "Tu pred." : "Su pred."}</span>
          <span className="hidden font-mono text-[9px] tracking-wider text-(--color-text4) uppercase text-center md:block">Result.</span>
          <span className="font-mono text-[9px] tracking-wider text-(--color-text4) uppercase text-center">Pts</span>
          <span />
        </div>

        {filtered.map((entry, index) => (
          <HistoryRow key={`${entry.date}-${index}`} entry={entry} isLast={index === filtered.length - 1} />
        ))}

        {filtered.length === 0 && (
          <p className="px-4 py-6 text-center font-mono text-xs text-(--color-text4)">Sin predicciones en esta fase</p>
        )}
      </div>

      {isOwnProfile && (
        <div className="mt-3 flex justify-center">
          <Link
            href="/partidos"
            className="rounded-xl border border-(--color-border-hi) bg-(--color-card-hi) px-4 py-2.5 font-mono text-xs font-semibold text-(--color-text2) tracking-wide"
          >
            Ver todas mis predicciones →
          </Link>
        </div>
      )}
    </section>
  )
}

function HistoryRow({ entry, isLast }: { entry: ProfileHistoryEntry; isLast: boolean }) {
  const predPillClass =
    entry.kind === "exact"
      ? "border-(--color-lime-deep) bg-(--color-lime-bg) text-(--color-primary)"
      : entry.kind === "result"
        ? "border-(--color-amber)/40 bg-(--color-amber)/10 text-(--color-amber)"
        : "border-red-400/40 bg-red-400/10 text-red-400"

  const ptsClass =
    entry.pts >= 3
      ? "text-(--color-primary)"
      : entry.pts > 0
        ? "text-(--color-amber)"
        : "text-(--color-text4)"

  return (
    <article className={`grid grid-cols-[1fr_72px_36px_32px] items-center gap-2 px-3 py-2.5 md:grid-cols-[40px_1fr_72px_52px_36px_32px] ${isLast ? "" : "border-b border-(--color-border-hi)"}`}>
      <span className="hidden font-mono text-[10px] text-(--color-text4) md:block">{entry.date}</span>

      <div className="flex min-w-0 items-center gap-1">
        <TeamLogo code={entry.homeFlag} logo={entry.homeLogo} size={14} />
        <span className="font-mono text-[10px] text-(--color-text3) truncate">{entry.homeTeam}</span>
        <span className="font-mono text-[9px] text-(--color-text4) shrink-0">vs</span>
        <TeamLogo code={entry.awayFlag} logo={entry.awayLogo} size={14} />
        <span className="font-mono text-[10px] text-(--color-text3) truncate">{entry.awayTeam}</span>
      </div>

      <span className={`inline-flex justify-center rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold ${predPillClass}`}>
        {entry.myPrediction}
      </span>

      <span className="hidden text-center font-mono text-[10px] text-(--color-text2) md:block">{entry.result}</span>

      <span className={`text-center font-mono text-[11px] font-semibold ${ptsClass}`}>
        {entry.pts > 0 ? "+" : ""}{entry.pts}
      </span>

      <KindIcon kind={entry.kind} />
    </article>
  )
}

function KindIcon({ kind }: { kind: ProfileHistoryEntry["kind"] }) {
  if (kind === "exact") {
    return (
      <span className="inline-flex size-6 items-center justify-center rounded-full bg-(--color-lime-bg) text-(--color-primary)">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    )
  }
  if (kind === "result") {
    return (
      <span className="inline-flex size-6 items-center justify-center rounded-full bg-(--color-amber)/10 text-(--color-amber)">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M3 6h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </span>
    )
  }
  return (
    <span className="inline-flex size-6 items-center justify-center rounded-full bg-red-400/10 text-red-400">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </span>
  )
}
