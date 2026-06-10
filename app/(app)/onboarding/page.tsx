import { redirect } from "next/navigation"
import { getOnboardingState, getGroupStageMatchesWithPredictions } from "@/features/onboarding/api"
import { OnboardingScreen } from "@/features/onboarding/components/onboarding-screen"
import { getStandingsByGroup } from "@/features/standings/api"
import type { GroupCode, OnboardingTeam } from "@/features/onboarding/types"
import { createServiceClient } from "@/lib/supabase/service"
import { createClient } from "@/lib/supabase/server"

const GROUPS: GroupCode[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]

function normalizeGroupCode(value: string | null | undefined): GroupCode | null {
  if (!value) return null
  const normalized = value.trim().toUpperCase().replace(/^GROUP\s+/, '')
  return GROUPS.includes(normalized as GroupCode) ? (normalized as GroupCode) : null
}

async function getTeamsByGroup(supabase: ReturnType<typeof createServiceClient>): Promise<Partial<Record<GroupCode, OnboardingTeam[]>>> {
  const standingsGroups = await getStandingsByGroup(supabase)
  const map = GROUPS.reduce(
    (acc, group) => {
      acc[group] = []
      return acc
    },
    {} as Record<GroupCode, OnboardingTeam[]>
  )

  function pushIfMissing(group: GroupCode, team: OnboardingTeam) {
    if (map[group].some((entry) => entry.code === team.code)) return
    map[group].push(team)
  }

  for (const groupStanding of standingsGroups) {
    const group = normalizeGroupCode(groupStanding.id)
    if (!group) continue
    for (const row of groupStanding.rows) {
      pushIfMissing(group, {
        code: row.team,
        name: row.teamName ?? row.team,
        logo: row.logo ?? null,
      })
    }
  }

  return map
}

export default async function OnboardingPage() {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const serviceClient = createServiceClient()
  const state = await getOnboardingState(serviceClient, user.id)
  if (state.step.status === "complete") {
    redirect("/")
  }

  const [teamsByGroup, matchesByGroup] = await Promise.all([
    getTeamsByGroup(serviceClient),
    state.step.status === "prode_picks"
      ? getGroupStageMatchesWithPredictions(serviceClient, user.id)
      : Promise.resolve(undefined),
  ])

  return (
    <OnboardingScreen
      step={state.step}
      savedData={{
        groupRankings: state.groupRankings,
        bestThirds: state.bestThirds,
        bracketPicks: state.bracketPicks,
        tournamentPredictions: state.tournamentPredictions,
      }}
      teamsByGroup={teamsByGroup}
      matchesByGroup={matchesByGroup}
    />
  )
}
