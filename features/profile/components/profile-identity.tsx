import { Flag } from "@/features/home/components/flag"
import type { ProfileUser } from "@/features/profile/types"
import { GroupAvatar } from "@/features/groups/components/group-avatar"

type ProfileIdentityProps = {
  user: ProfileUser
  accentColor: string
}

export function ProfileIdentity({ user, accentColor }: ProfileIdentityProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi) p-4">
      <span className="pointer-events-none absolute -top-8 left-1/2 size-72 -translate-x-1/2 rounded-full bg-(--color-lime-mid) opacity-15 blur-3xl" />
      <div className="relative flex items-center gap-4">
        <div className="relative">
          <GroupAvatar name={user.name} color={accentColor} size={84} ring />
          <span className="absolute -right-1 -bottom-1 rounded-lg bg-(--color-lime-hi) px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-black">
            LV {user.level}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-2xl font-bold tracking-tight">{user.name}</p>
          <p className="mt-0.5 font-mono text-xs text-(--color-text3)">
            {user.handle} · {user.joinedAt}
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-(--color-lime-deep) bg-(--color-lime-bg) px-2 py-1 font-mono text-[10px] font-semibold tracking-wider text-(--color-lime-hi) uppercase">
            <Flag code={user.championPick} size={14} />
            {user.championPick} champion pick
          </div>
        </div>
      </div>
    </section>
  )
}
