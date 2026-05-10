import type { ReactNode } from "react"

import { BottomNav } from "@/components/nav/bottom-nav"
import { TopNav } from "@/components/nav/top-nav"

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <TopNav />
      <main className="mx-auto w-full max-w-[1080px] px-4 pb-28  md:pb-6">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
