import type { MatchStatus } from "@/features/matches/types"

type MatchStatusBadgeProps = {
  status: MatchStatus
  minute: number | null
  kickoff: string
}

export function MatchStatusBadge({ status, minute, kickoff }: MatchStatusBadgeProps) {
  if (status === "LIVE") {
    return (
      <span className="inline-flex items-center rounded-full border border-(--color-lime-deep) bg-(--color-lime-bg) px-2 py-1 text-xs font-semibold text-(--color-lime-hi)">
        EN VIVO · {minute ?? 0}&apos;
      </span>
    )
  }

  if (status === "UPCOMING") {
    return <span className="text-xs text-(--color-text3)">{kickoff}</span>
  }

  return <span className="text-xs text-(--color-text4)">Final</span>
}
