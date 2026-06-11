"use client"

import { motion } from "framer-motion"
import Link from "next/link"

import { Flag } from "@/features/home/components/flag"
import { calcPoints } from "@/features/matches/utils/points"
import type { Match, Team } from "@/features/matches/types"
import { MatchStatusBadge } from "@/features/matches/components/match-status-badge"

type MatchCardProps = {
  match: Match
  teams: Record<string, Team>
  index: number
}

export function MatchCard({ match, teams, index }: MatchCardProps) {
  const home = teams[match.home]
  const away = teams[match.away]
  const points = calcPoints(match)
  const isLive = match.status === "LIVE"

  return (
    <Link href={`/partidos/${match.id}`} className="block">
      <motion.article
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.06, ease: "easeOut" }}
        className="rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi) p-4"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <p className="text-xs text-(--color-text3)">{match.stage}</p>
          <MatchStatusBadge status={match.status} minute={match.minute} kickoff={match.kickoff} />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Flag code={match.home} size={36} />
            <span className="truncate text-sm font-semibold">{home?.name ?? match.home}</span>
          </div>

          <p
            className="font-mono text-3xl font-bold"
            style={isLive ? { textShadow: "0 0 12px rgba(163,230,53,0.24)" } : undefined}
          >
            {match.hs ?? "-"}
            <span className="px-1 text-(--color-text3)">-</span>
            {match.as ?? "-"}
          </p>

          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm font-semibold">{away?.name ?? match.away}</span>
            <Flag code={match.away} size={36} />
          </div>
        </div>

        {match.status === "FINISHED" && match.pred ? (
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="font-mono text-foreground">
              {match.pred.hs}–{match.pred.as}
            </span>
            <span
              className={
                points?.exact
                  ? "font-semibold text-(--color-primary)"
                  : points?.winner
                    ? "font-semibold text-(--color-amber)"
                    : "font-semibold text-(--color-text4)"
              }
            >
              {points && points.pts > 0 ? "✓" : "✗"} {points?.pts ?? 0} pts
            </span>
          </div>
        ) : null}

        {match.status === "UPCOMING" && match.pred ? (
          <p className="mt-4 font-mono text-sm text-foreground">
            {match.pred.hs}–{match.pred.as}
          </p>
        ) : null}

        {match.status === "UPCOMING" && !match.pred ? (
          <p className="mt-4 text-sm font-semibold text-(--color-primary)">Predecir →</p>
        ) : null}
      </motion.article>
    </Link>
  )
}
