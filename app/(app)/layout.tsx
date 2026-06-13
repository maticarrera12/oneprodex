import type { ReactNode } from "react"

import { BottomNav } from "@/components/nav/bottom-nav"
import { TopNav } from "@/components/nav/top-nav"
import { syncUserProfileFromAuth } from "@/lib/auth/sync-user-profile"
import { createClient } from "@/lib/supabase/server"

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    await syncUserProfileFromAuth(user)
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <TopNav />
      <main className="mx-auto w-full max-w-[1080px] px-4 pb-28  md:pb-6">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
