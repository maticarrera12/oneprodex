"use client"

import { motion } from "framer-motion"

import { GroupAvatar } from "@/features/groups/components/group-avatar"
import { GroupTrend } from "@/features/groups/components/group-trend"
import type { RankingEntry } from "@/features/rankings/types"

type GroupRankRowProps = {
  entry: RankingEntry
  pulse: boolean
  showBorder: boolean
}

export function GroupRankRow({ entry, pulse, showBorder }: GroupRankRowProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={`relative flex items-center gap-3 px-3 py-3 ${showBorder ? "border-b border-(--color-border-hi)" : ""} ${
        entry.isYou ? "bg-(--color-lime-bg)" : ""
      }`}
    >
      {pulse ? (
        <motion.span
          initial={{ opacity: 0.35 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="pointer-events-none absolute inset-0 bg-(--color-lime-bg)"
        />
      ) : null}
      <span className={`w-6 text-center font-mono text-sm font-semibold ${entry.rank <= 3 ? "text-(--color-lime-hi)" : "text-(--color-text3)"}`}>
        {entry.rank}
      </span>
      <GroupAvatar name={entry.name} color={entry.color} size={36} ring={entry.isYou} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold">{entry.name}</p>
          {entry.streak >= 3 ? <span className="font-mono text-[10px] font-semibold text-(--color-amber)">🔥{entry.streak}</span> : null}
        </div>
        <p className="font-mono text-[11px] text-(--color-text3)">
          {entry.acc}% acc · {entry.handle}
        </p>
      </div>
      <GroupTrend delta={entry.delta} />
      <div className="min-w-10 text-right">
        <p className={`font-mono text-[17px] font-semibold leading-none ${entry.rank === 1 ? "text-(--color-lime-hi)" : "text-foreground"}`}>
          {entry.pts}
        </p>
        <p className="font-mono text-[9px] uppercase tracking-wider text-(--color-text3)">PTS</p>
      </div>
    </motion.article>
  )
}
