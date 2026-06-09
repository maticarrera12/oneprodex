"use client"

import { Activity, CircleDot } from "lucide-react"
import Image from "next/image"
import { useMemo, useState } from "react"

import { LiveDot } from "@/features/home/components/live-dot"
import { TeamLogo } from "@/features/shared/components/team-logo"
import { StandingsHeader } from "@/features/standings/components/standings-header"
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
    <div className="space-y-5 py-4 pb-6">
      <StandingsHeader />

      <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1">
        {groups.map((group) => {
          const active = group.id === groupId
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => setGroupId(group.id)}
              className={`inline-flex shrink-0 flex-col items-center justify-center rounded-xl border px-4 py-2.5 transition-colors ${
                active
                  ? "border-primary/50 bg-(--color-card-hi)"
                  : "border-transparent bg-transparent hover:border-(--color-border-hi)"
              }`}
            >
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                Grupo
              </span>
              <span
                className={`mt-0.5 text-sm font-bold uppercase ${active ? "text-primary" : "text-foreground"}`}
              >
                {group.id}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <LegendItem colorClass="bg-(--color-lime-mid)" label="Clasifica" />
        <LegendItem colorClass="bg-(--color-amber)" label="Playoff" />
        <LegendItem colorClass="bg-(--color-text4)" label="Eliminado" />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]">
        <section className="overflow-hidden rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi)">
          <div className="grid grid-cols-[28px_minmax(0,1fr)_repeat(6,32px)] items-center gap-x-2 border-b border-(--color-border-hi) px-3 py-2.5 font-mono text-[10px] tracking-wider text-(--color-text3) uppercase">
            <span className="text-center">#</span>
            <span>Equipo</span>
            <span className="text-center">PJ</span>
            <span className="text-center">G</span>
            <span className="text-center">E</span>
            <span className="text-center">P</span>
            <span className="text-center">GD</span>
            <span className="text-center">Pts</span>
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

        <aside className="space-y-4">
          <section className="relative min-h-[168px] overflow-hidden rounded-2xl border border-(--color-border-hi)">
            <Image
              src="/arco.webp"
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 360px"
              className="object-cover object-center opacity-70"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-linear-to-br from-background/96 via-background/88 to-background/62"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-linear-to-t from-background/65 via-transparent to-primary/8"
            />

            <div className="relative p-4">
              <div className="flex items-center gap-2">
                <Activity className="size-4 text-primary" strokeWidth={2.5} />
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">Actividad</p>
              </div>
              <div className="mt-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-foreground">{selected.insight.title}</p>
                  <p className="mt-1 text-sm text-(--color-text2)">{selected.insight.subtitle}</p>
                </div>
                <div
                  className="relative inline-flex size-16 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: `conic-gradient(var(--color-lime-mid) 0% ${selected.insight.pct}%, rgba(255,255,255,0.08) ${selected.insight.pct}% 100%)`,
                  }}
                >
                  <span className="inline-flex size-12 items-center justify-center rounded-full bg-background font-mono text-sm font-semibold text-primary">
                    {selected.insight.pct}%
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi) p-4">
            <div className="flex items-center gap-2">
              <CircleDot className="size-4 text-primary" strokeWidth={2.5} />
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
                Partidos · Grupo {selected.id}
              </p>
            </div>
            {selected.fixtures.length > 0 ? (
              <div className="mt-3 space-y-2">
                {selected.fixtures.map((fixture) => (
                  <FixtureRow key={fixture.id} fixture={fixture} />
                ))}
              </div>
            ) : (
              <div className="mt-6 flex flex-col items-center justify-center py-6 text-center">
                <span className="text-3xl opacity-40" aria-hidden>
                  ⚽
                </span>
                <p className="mt-3 text-sm text-muted-foreground">
                  No hay partidos cargados para este grupo.
                </p>
              </div>
            )}
          </section>
        </aside>
      </div>
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
    <div className="flex items-center gap-3 rounded-xl border border-(--color-border-hi) bg-(--color-bg2) px-3 py-2.5">
      <div className="w-16 shrink-0 font-mono text-[10px] text-(--color-text3)">
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
        <TeamLogo code={fixture.home} logo={fixture.logoHome} size={22} />
        <span className="text-sm font-semibold">{fixture.home}</span>
      </div>

      <div className="min-w-14 text-center font-mono text-sm font-semibold text-foreground">
        {fixture.status === "UPCOMING" ? "vs" : `${fixture.hs ?? 0} - ${fixture.as ?? 0}`}
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
        <span className="text-sm font-semibold">{fixture.away}</span>
        <TeamLogo code={fixture.away} logo={fixture.logoAway} size={22} />
      </div>
    </div>
  )
}
