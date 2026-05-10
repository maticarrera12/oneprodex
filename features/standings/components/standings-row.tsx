"use client"

import { motion } from "framer-motion"

import { Flag } from "@/features/home/components/flag"
import { TEAMS } from "@/features/matches/mock"
import type { StandingRow as StandingRowType } from "@/features/standings/types"

type StandingsRowProps = {
  row: StandingRowType
  position: number
  index: number
  showBorder: boolean
}

export function StandingsRow({ row, position, index, showBorder }: StandingsRowProps) {
  const team = TEAMS[row.team]
  const markerClass =
    row.qualification === "qual"
      ? "bg-(--color-lime-mid)"
      : row.qualification === "playoff"
        ? "bg-(--color-amber)"
        : "bg-(--color-text4)"

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.05, ease: "easeOut" }}
      className={`relative grid grid-cols-[24px_28px_26px_26px_26px_26px_34px_34px_54px] items-center gap-1.5 px-3 py-2.5 ${
        showBorder ? "border-b border-(--color-border-hi)" : ""
      }`}
    >
      <span className={`absolute top-1.5 bottom-1.5 left-0 w-1 rounded-r-sm ${markerClass}`} />
      <span className="pl-1 font-mono text-xs text-(--color-text3)">{position}</span>
      <div className="flex items-center justify-center">
        <Flag code={team?.code ?? row.team} size={22} />
      </div>
      <span className="text-center font-mono text-xs text-(--color-text2)">{row.pj}</span>
      <span className="text-center font-mono text-xs text-(--color-text2)">{row.g}</span>
      <span className="text-center font-mono text-xs text-(--color-text2)">{row.e}</span>
      <span className="text-center font-mono text-xs text-(--color-text2)">{row.p}</span>
      <span className={`text-center font-mono text-xs ${row.gd > 0 ? "text-(--color-lime-hi)" : row.gd < 0 ? "text-(--color-amber)" : "text-(--color-text2)"}`}>
        {row.gd > 0 ? `+${row.gd}` : row.gd}
      </span>
      <span className="text-center font-mono text-sm font-semibold text-foreground">{row.pts}</span>
      <div className="flex items-center justify-center gap-1">
        {row.form.map((value, formIndex) => (
          <span
            key={`${row.team}-${formIndex}`}
            className={`inline-flex size-3.5 items-center justify-center rounded-[4px] font-mono text-[8px] font-semibold ${
              value === "W"
                ? "bg-(--color-lime-mid) text-black"
                : value === "D"
                  ? "bg-(--color-text3) text-black/80"
                  : "bg-red-400 text-black"
            }`}
          >
            {value}
          </span>
        ))}
      </div>
    </motion.div>
  )
}
