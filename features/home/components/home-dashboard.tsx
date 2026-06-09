import { HomeGroupCard } from "@/features/home/components/home-group-card"
import { HomeHeroCard } from "@/features/home/components/home-hero-card"
import { HomeRankCard } from "@/features/home/components/home-rank-card"
import type { GroupInfo } from "@/features/groups/types"
import type { RankingEntry } from "@/features/rankings/types"

type HomeDashboardProps = {
  matchday: string
  group: GroupInfo | null
  allGroups: GroupInfo[]
  you: RankingEntry | undefined
  ptsFallback?: number
}

function getWeekdayLabel() {
  return new Intl.DateTimeFormat("es-AR", { weekday: "long" }).format(new Date())
}

export function HomeDashboard({ matchday, group, allGroups, you, ptsFallback }: HomeDashboardProps) {
  const weekday = getWeekdayLabel()
  const weekdayTitle = weekday.charAt(0).toUpperCase() + weekday.slice(1)

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]">
      <HomeHeroCard matchday={matchday} weekday={weekdayTitle} />
      <div className="grid gap-4 content-start">
        <HomeRankCard you={you} ptsFallback={ptsFallback} />
        <HomeGroupCard group={group} allGroups={allGroups} you={you} />
      </div>
    </section>
  )
}
