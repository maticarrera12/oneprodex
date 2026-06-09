import { getProfileAchievements } from "@/features/profile/api"
import { ProfileAchievementsFull } from "@/features/profile/components/profile-achievements-full"
import { EmptyState } from "@/features/shared/components/empty-state"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"

export default async function LogrosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <EmptyState message="Iniciá sesión para ver tus logros" />
  }

  const achievements = await getProfileAchievements(supabase, user.id)

  return (
    <div className="pb-8">
      <header className="grid grid-cols-[40px_1fr_40px] items-center gap-3 pt-4 pb-4">
        <Link
          href="/perfil"
          className="inline-flex size-10 items-center justify-center rounded-xl border border-(--color-border-hi) bg-(--color-card-hi)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div className="text-center">
          <h1 className="text-base font-semibold">Logros</h1>
          <p className="font-mono text-[10px] text-(--color-text3)">
            {achievements.filter((a) => a.got).length} / {achievements.length} conseguidos
          </p>
        </div>
        <div />
      </header>

      <ProfileAchievementsFull achievements={achievements} />
    </div>
  )
}
