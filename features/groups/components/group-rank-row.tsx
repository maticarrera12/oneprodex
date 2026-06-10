"use client"

import { motion } from "framer-motion"

import { GroupAvatar } from "@/features/groups/components/group-avatar"
import type { RankingEntry } from "@/features/rankings/types"

type GroupRankRowProps = {
  entry: RankingEntry
  pulse: boolean
  showBorder: boolean
}

function rankBarClass(rank: number) {
  if (rank === 1) return "bg-primary"
  if (rank === 2) return "bg-(--color-blue)"
  if (rank === 3) return "bg-(--color-violet)"
  return "bg-white/45"
}

function rankNumberClass(rank: number) {
  if (rank === 1) return "text-primary"
  if (rank === 2) return "text-(--color-blue)"
  if (rank === 3) return "text-(--color-violet)"
  return "text-foreground"
}

function rankPointsClass(rank: number) {
  if (rank === 1) return "text-primary"
  if (rank === 2) return "text-(--color-blue)"
  if (rank === 3) return "text-(--color-violet)"
  return "text-foreground"
}

function rankRowClass(rank: number) {
  if (rank === 1) {
    return "border-l-2 border-l-primary bg-primary/5 shadow-[inset_0_0_24px_rgba(190,242,100,0.06)]"
  }
  if (rank === 2) {
    return "border-l-2 border-l-(--color-blue) bg-[rgba(96,165,250,0.06)] shadow-[inset_0_0_20px_rgba(96,165,250,0.05)]"
  }
  if (rank === 3) {
    return "border-l-2 border-l-(--color-violet) bg-[rgba(167,139,250,0.06)] shadow-[inset_0_0_20px_rgba(167,139,250,0.05)]"
  }
  return ""
}

export function GroupRankRow({ entry, pulse, showBorder }: GroupRankRowProps) {
  const hits = entry.hits

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={`relative grid grid-cols-[28px_minmax(0,1fr)_88px_56px_56px] items-center gap-2 px-3 py-3 ${
        showBorder ? "border-b border-(--color-border-hi)" : ""
      } ${rankRowClass(entry.rank)} ${entry.isYou && entry.rank > 3 ? "bg-(--color-lime-bg)" : ""}`}
    >
      {pulse ? (
        <motion.span
          initial={{ opacity: 0.35 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="pointer-events-none absolute inset-0 bg-(--color-lime-bg)"
        />
      ) : null}

      <span className={`relative text-center font-mono text-sm font-semibold ${rankNumberClass(entry.rank)}`}>
        {entry.rank}
      </span>

      <div className="relative flex min-w-0 items-center gap-2.5">
        <GroupAvatar name={entry.name} color={entry.color} size={36} ring={entry.isYou} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{entry.name}</p>
          <p className="truncate font-mono text-[10px] text-(--color-text3)">@{entry.handle}</p>
        </div>
      </div>

      <div className="relative space-y-1">
        <div className="h-1.5 overflow-hidden rounded-full bg-background/80">
          <div
            className={`h-full rounded-full ${rankBarClass(entry.rank)}`}
            style={{ width: `${Math.min(100, entry.acc)}%` }}
          />
        </div>
        <p className={`text-center font-mono text-[10px] ${entry.rank > 3 ? "text-foreground/70" : "text-(--color-text2)"}`}>
          {entry.acc}%
        </p>
      </div>

      <p className="relative text-center font-mono text-sm font-semibold text-foreground">{hits}</p>

      <div className="relative text-right">
        <p className={`font-mono text-base font-semibold leading-none ${rankPointsClass(entry.rank)}`}>
          {entry.pts}
        </p>
        <p className="font-mono text-[9px] uppercase tracking-wider text-(--color-text3)">pts</p>
      </div>
    </motion.article>
  )
}
