import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { GroupAvatar } from "@/features/groups/components/group-avatar"
import type { GroupInfo } from "@/features/groups/types"
import type { RankingEntry } from "@/features/rankings/types"

type HomeGroupCardProps = {
  group: GroupInfo | null
  you: RankingEntry | undefined
}

export function HomeGroupCard({ group, you }: HomeGroupCardProps) {
  if (!group) {
    return (
      <article className="flex min-h-[200px] flex-col justify-center rounded-3xl border border-(--color-border-hi) bg-(--color-card-hi) p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">Tu grupo</p>
        <p className="mt-2 text-sm text-muted-foreground">Todavía no pertenecés a ningún grupo.</p>
        <Link
          href="/grupo"
          className="mt-4 inline-flex w-fit items-center gap-2 rounded-full border border-(--color-border-hi) px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          Unirse o crear
          <ArrowRight className="size-3.5" />
        </Link>
      </article>
    )
  }

  const member = you ?? {
    rank: 0,
    handle: "—",
    name: "—",
    color: "#84cc16",
    pts: 0,
    acc: 0,
    streak: 0,
    delta: 0,
    isYou: true,
  }

  return (
    <article className="rounded-3xl border border-(--color-border-hi) bg-(--color-card-hi) p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">Tu grupo</p>
          <h2 className="mt-1 text-sm font-bold uppercase tracking-[0.06em] text-foreground">
            Group · {group.name}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {group.members} {group.members === 1 ? "miembro" : "miembros"}
          </p>
        </div>
        <Link
          href="/grupo"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-(--color-border-hi) px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          Ver grupo
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-(--color-border-hi) bg-(--color-bg2) px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <GroupAvatar name={member.name} color={member.color} size={36} />
          <span className="truncate text-sm font-medium text-foreground">{member.handle}</span>
        </div>
        <span className="shrink-0 font-mono text-sm text-muted-foreground">{member.pts} pts</span>
      </div>
    </article>
  )
}
