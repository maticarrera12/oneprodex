"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

import { Flag } from "@/features/home/components/flag"
import { LiveDot } from "@/features/home/components/live-dot"
import { StandingsRow } from "@/features/standings/components/standings-row"
import type { GroupFixture, StandingGroup } from "@/features/standings/types"

type StandingsScreenProps = {
  groups: StandingGroup[]
}

export default function StandingsScreen({ groups }: StandingsScreenProps) {
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "A")
  const selected = useMemo(
    () => groups.find((group) => group.id === groupId) ?? groups[0],
    [groupId, groups]
  )

  if (!selected) return null

  return (
    <div className="space-y-4 py-4 pb-6">
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
          <h1 className="text-base font-semibold">Fase de grupos</h1>
          <p className="font-mono text-[10px] text-(--color-text3)">
            {selected.matchdayLabel} · {selected.played} / {selected.total} jugados
          </p>
        </div>
        <span className="inline-flex size-10 items-center justify-center rounded-xl border border-(--color-border-hi) bg-(--color-card-hi)">
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M3 5h10M3 8h10M3 11h6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
      </header>

      <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1">
        {groups.map((group) => {
          const active = group.id === groupId
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => setGroupId(group.id)}
              className={`inline-flex w-14 items-center justify-center rounded-xl border px-3 py-2 text-center ${
                active
                  ? "border-(--color-border-hi) bg-(--color-card-hi)"
                  : "border-transparent bg-transparent"
              }`}
            >
              <p className={`text-center text-xs font-bold ${active ? "text-(--color-primary)" : "text-foreground"}`}>
                {group.id}
              </p>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <LegendItem colorClass="bg-(--color-lime-mid)" label="Clasifica" />
        <LegendItem colorClass="bg-(--color-amber)" label="Playoff" />
        <LegendItem colorClass="bg-(--color-text4)" label="Eliminado" />
      </div>

      <section className="overflow-hidden rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi)">
        <div className="grid grid-cols-[24px_28px_26px_26px_26px_26px_34px_34px_54px] items-center gap-1.5 border-b border-(--color-border-hi) px-3 py-2 font-mono text-[10px] tracking-wider text-(--color-text3) uppercase">
          <span />
          <span />
          <span className="text-center">PJ</span>
          <span className="text-center">G</span>
          <span className="text-center">E</span>
          <span className="text-center">P</span>
          <span className="text-center">GD</span>
          <span className="text-center">Pts</span>
          <span className="text-center">Forma</span>
        </div>
        <div>
          {selected.rows.map((row, index) => (
            <StandingsRow
              key={`${selected.id}-${row.team}`}
              row={row}
              position={index + 1}
              index={index}
              showBorder={index < selected.rows.length - 1}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-mono text-xs uppercase tracking-wider text-(--color-text3)">
          Fixtures {selected.name}
        </h2>
        <div className="space-y-2">
          {selected.fixtures.map((fixture) => (
            <FixtureRow key={fixture.id} fixture={fixture} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-(--color-lime-deep) bg-(--color-lime-bg) p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-(--color-primary)">Tus predicciones</p>
            <p className="mt-1 text-base font-semibold">{selected.insight.title}</p>
            <p className="mt-1 text-sm text-(--color-text2)">{selected.insight.subtitle}</p>
          </div>
          <div
            className="relative inline-flex size-16 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(var(--color-lime-mid) 0% ${selected.insight.pct}%, rgba(255,255,255,0.08) ${selected.insight.pct}% 100%)`,
            }}
          >
            <span className="inline-flex size-12 items-center justify-center rounded-full bg-background font-mono text-sm font-semibold text-(--color-primary)">
              {selected.insight.pct}%
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}

function LegendItem({ colorClass, label }: { colorClass: string; label: string }) {
  return (
    <div className="inline-flex items-center gap-2">
      <span className={`inline-flex size-2 rounded-sm ${colorClass}`} />
      <span className="font-mono text-[10px] uppercase tracking-wider text-(--color-text3)">{label}</span>
    </div>
  )
}

function FixtureRow({ fixture }: { fixture: GroupFixture }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-(--color-border-hi) bg-(--color-card-hi) px-3 py-2.5">
      <div className="w-16 font-mono text-[10px] text-(--color-text3)">
        {fixture.status === "LIVE" ? (
          <span className="inline-flex items-center gap-1 text-(--color-primary)">
            <LiveDot />
            {fixture.minute ?? 0}&apos;
          </span>
        ) : fixture.status === "FT" ? (
          "Final"
        ) : (
          fixture.when
        )}
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Flag code={fixture.home} size={22} />
        <span className="text-sm font-semibold">{fixture.home}</span>
      </div>

      <div className="min-w-14 text-center font-mono text-sm font-semibold text-foreground">
        {fixture.status === "UPCOMING" ? "vs" : `${fixture.hs ?? 0} - ${fixture.as ?? 0}`}
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
        <span className="text-sm font-semibold">{fixture.away}</span>
        <Flag code={fixture.away} size={22} />
      </div>
    </div>
  )
}
