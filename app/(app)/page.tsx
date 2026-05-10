import { GroupSection } from "@/features/home/components/group-section"
import { HeroHeader } from "@/features/home/components/hero-header"
import { LiveSection } from "@/features/home/components/live-section"
import { MatchdayStats } from "@/features/home/components/matchday-stats"
import { UpcomingSection } from "@/features/home/components/upcoming-section"
import { GROUP_INFO, ACTIVITY } from "@/features/groups/mock"
import { MATCHES, TEAMS } from "@/features/matches/mock"
import { LEADERBOARD } from "@/features/rankings/mock"

export default function HomePage() {
  const liveMatches = MATCHES.filter((match) => match.status === "LIVE")
  const upcomingMatches = MATCHES.filter((match) => match.status === "UPCOMING")
  const you = LEADERBOARD.find((entry) => entry.isYou)
  const top3 = LEADERBOARD.slice(0, 3)

  return (
    <div className="space-y-6">
      <HeroHeader matchday={GROUP_INFO.matchday} you={you} />
      <LiveSection liveMatches={liveMatches} teams={TEAMS} />
      <GroupSection group={GROUP_INFO} top3={top3} activity={ACTIVITY.slice(0, 3)} />
      <UpcomingSection matches={upcomingMatches} teams={TEAMS} />
      <MatchdayStats
        pts={you?.pts ?? 0}
        ptsDelta={you?.delta ?? 0}
        acc={you?.acc ?? 0}
        accDelta={1}
        streak={you?.streak ?? 0}
        streakDelta={0}
      />
    </div>
  )
}
