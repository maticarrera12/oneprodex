"use client"

import type { MatchLineupRow } from "@/lib/api-football/types"

type LineupsPanelProps = {
  lineups: { home: MatchLineupRow[]; away: MatchLineupRow[] }
  playersMap: Map<number, string>
}

function PlayerRow({ player, photoUrl }: { player: MatchLineupRow; photoUrl: string | undefined }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <span className="w-6 shrink-0 font-mono text-[11px] text-(--color-text3) text-right">
        {player.number ?? ""}
      </span>
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={player.name}
          className="size-7 rounded-full border border-white/15 object-cover shrink-0"
        />
      ) : (
        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-(--color-border-hi) bg-(--color-bg2) font-mono text-[10px] text-(--color-text2)">
          {player.name.slice(0, 2).toUpperCase()}
        </span>
      )}
      <p className="truncate text-sm text-foreground">{player.name}</p>
    </div>
  )
}

function TeamLineup({
  label,
  starters,
  substitutes,
  playersMap,
}: {
  label: string
  starters: MatchLineupRow[]
  substitutes: MatchLineupRow[]
  playersMap: Map<number, string>
}) {
  return (
    <div>
      <p className="px-3 pt-3 pb-1 font-mono text-[10px] uppercase tracking-wider text-(--color-text3)">
        {label}
      </p>
      {starters.length > 0 && (
        <div>
          <p className="px-3 py-1 text-[11px] text-(--color-text3)">Titulares</p>
          {starters.map((player) => (
            <PlayerRow
              key={player.player_api_id}
              player={player}
              photoUrl={playersMap.get(player.player_api_id)}
            />
          ))}
        </div>
      )}
      {substitutes.length > 0 && (
        <div>
          <p className="px-3 py-1 text-[11px] text-(--color-text3)">Suplentes</p>
          {substitutes.map((player) => (
            <PlayerRow
              key={player.player_api_id}
              player={player}
              photoUrl={playersMap.get(player.player_api_id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function LineupsPanel({ lineups, playersMap }: LineupsPanelProps) {
  const isEmpty = lineups.home.length === 0 && lineups.away.length === 0

  if (isEmpty) {
    return (
      <div className="rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi) p-6 text-center">
        <p className="text-sm text-(--color-text3)">Alineaciones todavía no disponibles</p>
      </div>
    )
  }

  const homeStarters = lineups.home.filter((p) => !p.is_substitute)
  const homeSubs = lineups.home.filter((p) => p.is_substitute)
  const awayStarters = lineups.away.filter((p) => !p.is_substitute)
  const awaySubs = lineups.away.filter((p) => p.is_substitute)

  return (
    <div className="space-y-2">
      {lineups.home.length > 0 && (
        <div className="rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi) overflow-hidden">
          <TeamLineup
            label="Local"
            starters={homeStarters}
            substitutes={homeSubs}
            playersMap={playersMap}
          />
        </div>
      )}
      {lineups.away.length > 0 && (
        <div className="rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi) overflow-hidden">
          <TeamLineup
            label="Visitante"
            starters={awayStarters}
            substitutes={awaySubs}
            playersMap={playersMap}
          />
        </div>
      )}
    </div>
  )
}

export default LineupsPanel
