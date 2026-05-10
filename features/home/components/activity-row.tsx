import type { ActivityItem } from "@/features/groups/types"

type ActivityRowProps = {
  item: ActivityItem
}

export function ActivityRow({ item }: ActivityRowProps) {
  const tone =
    item.kind === "exact_score" || item.kind === "correct_result"
      ? "text-primary"
      : item.kind === "missed"
        ? "text-red-400"
        : "text-foreground/80"

  return (
    <article className="flex items-start gap-3 px-0 py-2.5">
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-card/90 text-xs font-semibold text-foreground ring-1 ring-white/8">
        {item.who.slice(0, 1).toUpperCase()}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground/85">
          <span className="font-semibold text-foreground">{item.who}</span> {item.action}{" "}
          <span className={`font-semibold ${tone}`}>{item.detail}</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {item.meta} · {item.time}
        </p>
      </div>
    </article>
  )
}
