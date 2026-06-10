import { MatchScheduleRow } from "@/features/matches/components/match-schedule-row"
import type { Match, Team } from "@/features/matches/types"

type UpcomingRowProps = {
  match: Match
  teams: Record<string, Team>
}

export function UpcomingRow({ match, teams }: UpcomingRowProps) {
  return <MatchScheduleRow match={match} teams={teams} layout="inline" />
}
