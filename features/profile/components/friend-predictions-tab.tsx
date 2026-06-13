import type { FriendPredictionEntry, FriendPredictionsTabData, FriendUpcomingEntry } from "@/features/profile/api"
import { TeamLogo } from "@/features/shared/components/team-logo"

type FriendPredictionsTabProps = {
  data: FriendPredictionsTabData
}

export function FriendPredictionsTab({ data }: FriendPredictionsTabProps) {
  const { finished, live, upcomingNext5 } = data
  const isEmpty = finished.length === 0 && live.length === 0 && upcomingNext5.length === 0

  if (isEmpty) {
    return (
      <div className="py-12 text-center text-sm text-(--color-text3)">
        Sin predicciones aún
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {live.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-(--color-text2)">
            En Vivo
          </h3>
          <div className="overflow-hidden rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi)">
            {live.map((entry, i) => (
              <FinishedLiveRow
                key={entry.matchId}
                entry={entry}
                isLast={i === live.length - 1}
              />
            ))}
          </div>
        </section>
      )}

      {finished.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-(--color-text2)">
            Jugados
          </h3>
          <div className="overflow-hidden rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi)">
            {finished.map((entry, i) => (
              <FinishedLiveRow
                key={entry.matchId}
                entry={entry}
                isLast={i === finished.length - 1}
              />
            ))}
          </div>
        </section>
      )}

      {upcomingNext5.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-(--color-text2)">
            Próximos
          </h3>
          <div className="overflow-hidden rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi)">
            {upcomingNext5.map((entry, i) => (
              <UpcomingRow
                key={entry.matchId}
                entry={entry}
                isLast={i === upcomingNext5.length - 1}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function FinishedLiveRow({
  entry,
  isLast,
}: {
  entry: FriendPredictionEntry
  isLast: boolean
}) {
  const predPillClass =
    entry.status === "LIVE"
      ? "border-(--color-border-hi) bg-(--color-card-hi) text-(--color-text2)"
      : entry.kind === "exact"
        ? "border-(--color-lime-deep) bg-(--color-lime-bg) text-(--color-primary)"
        : entry.kind === "result"
          ? "border-(--color-amber)/40 bg-(--color-amber)/10 text-(--color-amber)"
          : "border-red-400/40 bg-red-400/10 text-red-400"

  const hasPick = entry.predictedHome !== null && entry.predictedAway !== null
  const ptsClass =
    (entry.pts ?? 0) >= 3
      ? "text-(--color-primary)"
      : (entry.pts ?? 0) > 0
        ? "text-(--color-amber)"
        : "text-(--color-text4)"

  return (
    <article
      className={`grid grid-cols-[1fr_80px_36px] items-center gap-2 px-3 py-2.5 ${isLast ? "" : "border-b border-(--color-border-hi)"}`}
    >
      <div className="flex min-w-0 items-center gap-1">
        <TeamLogo code={entry.homeTeam} logo={entry.homeLogo} size={14} />
        <span className="truncate font-mono text-[10px] text-(--color-text3)">{entry.homeTeam}</span>
        <span className="shrink-0 font-mono text-[9px] text-(--color-text4)">vs</span>
        <TeamLogo code={entry.awayTeam} logo={entry.awayLogo} size={14} />
        <span className="truncate font-mono text-[10px] text-(--color-text3)">{entry.awayTeam}</span>
      </div>

      {hasPick ? (
        <span
          className={`inline-flex justify-center rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold ${predPillClass}`}
        >
          {entry.predictedHome} - {entry.predictedAway}
        </span>
      ) : (
        <span className="text-center font-mono text-[10px] text-(--color-text4)">—</span>
      )}

      <span className={`text-center font-mono text-[11px] font-semibold ${ptsClass}`}>
        {entry.pts !== null ? (entry.pts > 0 ? `+${entry.pts}` : String(entry.pts)) : "—"}
      </span>
    </article>
  )
}

function UpcomingRow({
  entry,
  isLast,
}: {
  entry: FriendUpcomingEntry
  isLast: boolean
}) {
  const hasPick = entry.predictedHome !== null && entry.predictedAway !== null

  return (
    <article
      className={`grid grid-cols-[1fr_80px] items-center gap-2 px-3 py-2.5 ${isLast ? "" : "border-b border-(--color-border-hi)"}`}
    >
      <div className="flex min-w-0 items-center gap-1">
        <TeamLogo code={entry.homeTeam} logo={entry.homeLogo} size={14} />
        <span className="truncate font-mono text-[10px] text-(--color-text3)">{entry.homeTeam}</span>
        <span className="shrink-0 font-mono text-[9px] text-(--color-text4)">vs</span>
        <TeamLogo code={entry.awayTeam} logo={entry.awayLogo} size={14} />
        <span className="truncate font-mono text-[10px] text-(--color-text3)">{entry.awayTeam}</span>
      </div>

      {hasPick ? (
        <span className="inline-flex justify-center rounded-full border border-(--color-border-hi) bg-(--color-card-hi) px-2 py-0.5 font-mono text-[10px] font-semibold text-(--color-text2)">
          {entry.predictedHome} - {entry.predictedAway}
        </span>
      ) : (
        <span className="text-center font-mono text-[10px] text-(--color-text4)">Sin predicción</span>
      )}
    </article>
  )
}
