import { redirect } from "next/navigation"
import { getOnboardingState } from "@/features/onboarding/api"
import { OnboardingScreen } from "@/features/onboarding/components/onboarding-screen"
import type { GroupCode, OnboardingTeam } from "@/features/onboarding/types"
import { createServiceClient } from "@/lib/supabase/service"
import { createClient } from "@/lib/supabase/server"

const GROUPS: GroupCode[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]

async function getTeamsByGroup() {
  const supabase = createServiceClient()
  const [standingsResult, teamsResult] = await Promise.all([
    supabase
      .from("standings")
      .select("group_code,team_code,points,goals_for,goals_against")
      .order("group_code", { ascending: true })
      .order("points", { ascending: false })
      .order("goals_for", { ascending: false })
      .order("goals_against", { ascending: true }),
    supabase.from("teams").select("code,name,logo"),
  ])

  const teamsByCode = new Map((teamsResult.data ?? []).map((team) => [team.code, team] as const))
  const map = GROUPS.reduce(
    (acc, group) => {
      acc[group] = []
      return acc
    },
    {} as Record<GroupCode, OnboardingTeam[]>
  )

  for (const row of standingsResult.data ?? []) {
    const group = row.group_code as GroupCode
    if (!GROUPS.includes(group)) continue
    const team = teamsByCode.get(row.team_code)
    map[group].push({
      code: row.team_code,
      name: team?.name ?? row.team_code,
      logo: team?.logo ?? null,
    })
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
  if (state.step === "complete") {
    redirect("/")
  }

  const teamsByGroup = await getTeamsByGroup()

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
    />
  )
}
