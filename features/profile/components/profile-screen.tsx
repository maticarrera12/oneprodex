import type { ProfileData } from "@/features/profile/api"
import { ProfileAchievementsGrid } from "@/features/profile/components/profile-achievements-grid"
import { ProfileFormBreakdown } from "@/features/profile/components/profile-form-breakdown"
import { ProfileHeader } from "@/features/profile/components/profile-header"
import { ProfileHeroStats } from "@/features/profile/components/profile-hero-stats"
import { ProfileHistoryList } from "@/features/profile/components/profile-history-list"
import { ProfileIdentity } from "@/features/profile/components/profile-identity"
import { ProfileLevelProgress } from "@/features/profile/components/profile-level-progress"

type ProfileScreenProps = {
  data: ProfileData
  /** Hide the "Ver todas mis predicciones" CTA (it links to your own /partidos). */
  showSeeAllPredictions?: boolean
}

export default function ProfileScreen({ data, showSeeAllPredictions = true }: ProfileScreenProps) {
  const userColor = "hsl(83 81% 62%)"

  return (
    <div className="space-y-5 pt-4 pb-8">
      <ProfileHeader />
      <ProfileIdentity user={data.user} accentColor={userColor} />
      <ProfileHeroStats stats={data.heroStats} />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-stretch">
        <ProfileLevelProgress user={data.user} />
        <ProfileFormBreakdown values={data.formLast7} />
      </div>
      <ProfileAchievementsGrid achievements={data.achievements} />
      <ProfileHistoryList entries={data.history} showSeeAll={showSeeAllPredictions} />
    </div>
  )
}
