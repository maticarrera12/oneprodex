import StandingsScreen from "@/features/standings/components/standings-screen"
import { STANDINGS_GROUPS } from "@/features/standings/mock"

export default function StandingsPage() {
  return <StandingsScreen groups={STANDINGS_GROUPS} />
}
