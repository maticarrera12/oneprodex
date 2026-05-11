import { getStandingsByGroup } from "@/features/standings/api"
import StandingsScreen from "@/features/standings/components/standings-screen"
import { EmptyState } from "@/features/shared/components/empty-state"
import { createClient } from "@/lib/supabase/server"

export default async function StandingsPage() {
  const supabase = await createClient()
  const groups = await getStandingsByGroup(supabase)

  if (groups.length === 0) {
    return <EmptyState message="Sin datos de posiciones" />
  }

  return <StandingsScreen groups={groups} />
}
