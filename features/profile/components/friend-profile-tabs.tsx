"use client"

import { useState } from "react"
import type { getBracketData } from "@/features/bracket/api"
import { FriendBracketTab } from "@/features/bracket/components/friend-bracket-tab"
import type { FriendPredictionsTabData, ProfileData } from "@/features/profile/api"
import { FriendPredictionsTab } from "@/features/profile/components/friend-predictions-tab"
import ProfileScreen from "@/features/profile/components/profile-screen"

type BracketData = NonNullable<Awaited<ReturnType<typeof getBracketData>>>

const TABS = ["Perfil", "Bracket", "Predicciones"] as const
type Tab = (typeof TABS)[number]

type FriendProfileTabsProps = {
  profileData: ProfileData
  bracketData: BracketData | null
  predictionsData: FriendPredictionsTabData
}

export function FriendProfileTabs({
  profileData,
  bracketData,
  predictionsData,
}: FriendProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Perfil")

  return (
    <div>
      <div className="scrollbar-none -mx-1 mb-4 flex gap-2 overflow-x-auto px-1">
        {TABS.map((tab) => {
          const isActive = tab === activeTab
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                isActive
                  ? "border-(--color-border-hi) bg-(--color-card-hi) text-foreground"
                  : "border-(--color-border-hi) text-(--color-text2)"
              }`}
            >
              {tab}
            </button>
          )
        })}
      </div>

      {activeTab === "Perfil" && (
        <ProfileScreen data={profileData} showSeeAllPredictions={false} />
      )}

      {activeTab === "Bracket" && <FriendBracketTab data={bracketData} />}

      {activeTab === "Predicciones" && (
        <FriendPredictionsTab data={predictionsData} />
      )}
    </div>
  )
}
