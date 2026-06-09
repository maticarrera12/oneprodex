import { HomeDashboard } from "@/features/home/components/home-dashboard"
import { LivePoller } from "@/features/home/components/live-poller"
import { LiveSection } from "@/features/home/components/live-section"
import { MatchdayStats } from "@/features/home/components/matchday-stats"
import { UpcomingSection } from "@/features/home/components/upcoming-section"
import { getHomeData } from "@/features/home/api"
import { TEAMS } from "@/features/matches/mock"
import { EmptyState } from "@/features/shared/components/empty-state"
import { createClient } from "@/lib/supabase/server"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const data = user ? await getHomeData(supabase, user.id) : null

  return (
    <div className="space-y-6">
      <HomeDashboard
        matchday={data?.groupInfo?.matchday ?? "Jornada actual"}
        group={data?.groupInfo ?? null}
        you={data?.you}
        ptsFallback={data?.stats.pts}
      />
      {data && data.liveMatches.length > 0 ? (
        <>
          <LivePoller />
          <LiveSection liveMatches={data.liveMatches} teams={TEAMS} />
        </>
      ) : (
        <EmptyState message="No hay partidos en vivo" />
      )}
      {data && data.upcomingMatches.length > 0 ? (
        <UpcomingSection matches={data.upcomingMatches} teams={TEAMS} />
      ) : (
        <EmptyState message="No hay próximos partidos" />
      )}
      <MatchdayStats
        pts={data?.stats.pts ?? 0}
        ptsDelta={0}
        acc={data?.stats.acc ?? 0}
        accDelta={1}
        streak={data?.stats.streak ?? 0}
        streakDelta={0}
      />
    </div>
  )
}
