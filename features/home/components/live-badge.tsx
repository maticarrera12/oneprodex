import { LiveDot } from "@/features/home/components/live-dot"

type LiveBadgeProps = {
  minute: number | null
}

export function LiveBadge({ minute }: LiveBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-(--color-lime-bg2) px-2.5 py-1 text-xs font-semibold text-primary">
      <LiveDot />
      <span>
        EN VIVO · {minute ?? 0}
        &apos;
      </span>
    </div>
  )
}
