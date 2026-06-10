import Image from "next/image"
import type { ProfileUser } from "@/features/profile/types"
import { GroupAvatar } from "@/features/groups/components/group-avatar"
import { TeamLogo } from "@/features/shared/components/team-logo"

type ProfileIdentityProps = {
  user: ProfileUser
  accentColor: string
}

export function ProfileIdentity({ user, accentColor }: ProfileIdentityProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi) p-4">
      <Image
        src="/fondo-podio.png"
        alt=""
        fill
        className="object-cover opacity-50 pointer-events-none"
      />
      <span className="pointer-events-none absolute -top-8 left-1/2 size-72 -translate-x-1/2 rounded-full bg-(--color-lime-mid) opacity-15 blur-3xl" />
      <span className="pointer-events-none absolute top-2 right-3 font-mono text-[72px] font-black leading-none tracking-tighter text-(--color-primary) opacity-10 select-none">
        2026
      </span>
      <div className="relative flex items-center gap-4">
        <div className="relative shrink-0">
          <GroupAvatar name={user.name} color={accentColor} size={84} ring />
          <span className="absolute -right-1 -bottom-1 rounded-lg bg-(--color-primary) px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-black">
            LV {user.level}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-2xl font-bold tracking-tight">{user.name}</p>
          <p className="mt-0.5 font-mono text-xs text-(--color-text3)">
            @{user.handle} · {user.joinedAt}
          </p>
          <p className="mt-0.5 font-mono text-[11px] font-semibold text-(--color-primary)">
            {user.levelTitle}
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-(--color-lime-deep) bg-(--color-lime-bg) px-2 py-1 font-mono text-[10px] font-semibold tracking-wider text-(--color-primary) uppercase">
            {user.championPick ? (
              <>
                <TeamLogo code={user.championPick} logo={user.championPickLogo} size={14} />
                {user.championPickName ?? user.championPick} champion pick
              </>
            ) : (
              "Sin champion pick"
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
