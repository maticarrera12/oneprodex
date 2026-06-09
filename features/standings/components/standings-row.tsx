"use client"

import { motion } from "framer-motion"

import { TeamLogo } from "@/features/shared/components/team-logo"
import type { StandingRow as StandingRowType } from "@/features/standings/types"

type StandingsRowProps = {
  row: StandingRowType
  position: number
  index: number
  showBorder: boolean
}

export function StandingsRow({ row, position, index, showBorder }: StandingsRowProps) {
  const markerClass =
    row.qualification === "qual"
      ? "bg-(--color-lime-mid)"
      : row.qualification === "playoff"
        ? "bg-(--color-amber)"
        : "bg-(--color-text4)"

  const teamLabel = row.teamName ?? row.team

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.05, ease: "easeOut" }}
      className={`relative grid grid-cols-[28px_minmax(0,1fr)_repeat(6,32px)] items-center gap-x-2 px-3 py-3 ${
        showBorder ? "border-b border-(--color-border-hi)" : ""
      }`}
    >
      <span className={`absolute top-2 bottom-2 left-0 w-1 rounded-r-sm ${markerClass}`} />
      <span className="pl-1 text-center font-mono text-xs text-(--color-text3)">{position}</span>

      <div className="flex min-w-0 items-center gap-2">
        <TeamLogo code={row.team} logo={row.logo} size={24} />
        <span className="truncate text-sm font-semibold text-foreground">{teamLabel}</span>
      </div>

      <span className="text-center font-mono text-xs text-(--color-text2)">{row.pj}</span>
      <span className="text-center font-mono text-xs text-(--color-text2)">{row.g}</span>
      <span className="text-center font-mono text-xs text-(--color-text2)">{row.e}</span>
      <span className="text-center font-mono text-xs text-(--color-text2)">{row.p}</span>
      <span
        className={`text-center font-mono text-xs ${
          row.gd > 0 ? "text-(--color-primary)" : row.gd < 0 ? "text-red-400" : "text-(--color-text2)"
        }`}
      >
        {row.gd > 0 ? `+${row.gd}` : row.gd}
      </span>
      <span className="flex justify-center">
        <span className="inline-flex size-8 items-center justify-center rounded-full bg-background font-mono text-sm font-semibold text-foreground ring-1 ring-(--color-border-hi)">
          {row.pts}
        </span>
      </span>
    </motion.div>
  )
}
