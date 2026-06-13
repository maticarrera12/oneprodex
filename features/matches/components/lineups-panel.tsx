"use client"

import { useEffect, useMemo, useState } from "react"

import { Flag } from "@/features/home/components/flag"
import { TeamLogo } from "@/features/shared/components/team-logo"
import type { MatchLineupRow } from "@/lib/api-football/types"

type LineupsPanelProps = {
  lineups: { home: MatchLineupRow[]; away: MatchLineupRow[] }
  playersMap: Map<number, string>
  homeCode: string
  awayCode: string
  homeLogo?: string | null
  awayLogo?: string | null
}

type TeamSide = "home" | "away"

function sortByGrid(players: MatchLineupRow[]): MatchLineupRow[] {
  return [...players].sort((a, b) => {
    if (a.grid && b.grid) return a.grid.localeCompare(b.grid, undefined, { numeric: true })
    if (a.number !== null && b.number !== null) return a.number - b.number
    return a.name.localeCompare(b.name)
  })
}

function PlayerRow({ player, photoUrl }: { player: MatchLineupRow; photoUrl: string | undefined }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2">
      <span className="w-5 shrink-0 font-mono text-[11px] text-(--color-text3) text-right">
        {player.number ?? "–"}
      </span>
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={player.name}
          className="size-8 rounded-full border border-white/15 object-cover shrink-0"
        />
      ) : (
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-(--color-border-hi) bg-(--color-bg2) font-mono text-[10px] text-(--color-text2)">
          {player.name.slice(0, 2).toUpperCase()}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{player.name}</p>
        {player.position ? (
          <p className="font-mono text-[10px] text-(--color-text3)">{player.position}</p>
        ) : null}
      </div>
    </div>
  )
}

function TeamLineupCard({
  teamCode,
  logo,
  rows,
  playersMap,
  pending = false,
}: {
  teamCode: string
  logo?: string | null
  rows: MatchLineupRow[]
  playersMap: Map<number, string>
  pending?: boolean
}) {
  const starters = sortByGrid(rows.filter((p) => !p.is_substitute))
  const substitutes = sortByGrid(rows.filter((p) => p.is_substitute))

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi)">
      <div className="flex items-center gap-2 border-b border-(--color-border-hi) px-4 py-3">
        <TeamLogo code={teamCode} logo={logo} size={28} />
        <p className="text-sm font-semibold">{teamCode}</p>
      </div>

      {pending ? (
        <div className="flex flex-1 items-center justify-center p-8 text-center">
          <p className="text-sm text-(--color-text3)">Alineación pendiente</p>
        </div>
      ) : (
        <div className="flex-1 divide-y divide-(--color-border-hi)">
          <div>
            <p className="px-4 pt-3 pb-1 font-mono text-[10px] uppercase tracking-wider text-(--color-text3)">
              Titulares · {starters.length}
            </p>
            {starters.length === 0 ? (
              <p className="px-4 pb-3 text-xs text-(--color-text3)">Sin titulares confirmados</p>
            ) : (
              starters.map((player) => (
                <PlayerRow
                  key={player.player_api_id}
                  player={player}
                  photoUrl={playersMap.get(player.player_api_id)}
                />
              ))
            )}
          </div>
          {substitutes.length > 0 ? (
            <div>
              <p className="px-4 pt-3 pb-1 font-mono text-[10px] uppercase tracking-wider text-(--color-text3)">
                Suplentes · {substitutes.length}
              </p>
              {substitutes.map((player) => (
                <PlayerRow
                  key={player.player_api_id}
                  player={player}
                  photoUrl={playersMap.get(player.player_api_id)}
                />
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

export function LineupsPanel({
  lineups,
  playersMap,
  homeCode,
  awayCode,
  homeLogo,
  awayLogo,
}: LineupsPanelProps) {
  const hasHome = lineups.home.length > 0
  const hasAway = lineups.away.length > 0
  const availableSides = useMemo(() => {
    const sides: TeamSide[] = []
    if (hasHome) sides.push("home")
    if (hasAway) sides.push("away")
    return sides
  }, [hasAway, hasHome])

  const [mobileSide, setMobileSide] = useState<TeamSide>("home")

  useEffect(() => {
    if (availableSides.length === 0) return
    if (!availableSides.includes(mobileSide)) {
      setMobileSide(availableSides[0]!)
    }
  }, [availableSides, mobileSide])

  if (!hasHome && !hasAway) {
    return (
      <section className="rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi) p-8 text-center">
        <p className="text-sm text-(--color-text3)">Alineaciones todavía no disponibles</p>
        <p className="mt-1 text-xs text-(--color-text3)">Se publican cerca del kickoff</p>
      </section>
    )
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-wider text-(--color-text2) uppercase">Alineaciones</p>
        <p className="font-mono text-[10px] text-(--color-text3)">
          {[hasHome ? homeCode : null, hasAway ? awayCode : null].filter(Boolean).join(" · ")}
        </p>
      </div>

      {availableSides.length > 1 ? (
        <div className="flex gap-2 lg:hidden">
          {availableSides.map((side) => {
            const code = side === "home" ? homeCode : awayCode
            const logo = side === "home" ? homeLogo : awayLogo
            const active = mobileSide === side
            return (
              <button
                key={side}
                type="button"
                onClick={() => setMobileSide(side)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                  active
                    ? "border-primary/45 bg-primary/15 text-primary"
                    : "border-(--color-border-hi) bg-(--color-card-hi) text-(--color-text2)"
                }`}
              >
                {logo ? (
                  <img src={logo} alt={code} className="size-5 rounded-full border border-white/20 object-cover" />
                ) : (
                  <Flag code={code} size={20} />
                )}
                {code}
              </button>
            )
          })}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={availableSides.length > 1 && mobileSide !== "home" ? "hidden lg:block" : ""}>
          <TeamLineupCard
            teamCode={homeCode}
            logo={homeLogo}
            rows={lineups.home}
            playersMap={playersMap}
            pending={!hasHome}
          />
        </div>
        <div className={availableSides.length > 1 && mobileSide !== "away" ? "hidden lg:block" : ""}>
          <TeamLineupCard
            teamCode={awayCode}
            logo={awayLogo}
            rows={lineups.away}
            playersMap={playersMap}
            pending={!hasAway}
          />
        </div>
      </div>
    </section>
  )
}

export default LineupsPanel
