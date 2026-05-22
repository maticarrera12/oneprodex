import { MatchScheduleRow } from "@/features/matches/components/match-schedule-row"
import { groupMatchesByDay } from "@/features/matches/utils/kickoff"
import type { Match, Team } from "@/features/matches/types"

type MatchesByDayListProps = {
  matches: Match[]
  teams: Record<string, Team>
}

export function MatchesByDayList({ matches, teams }: MatchesByDayListProps) {
  const dayGroups = groupMatchesByDay(matches)

  return (
    <div className="space-y-8">
      {dayGroups.map((day) => (
        <section key={day.dayKey} className="space-y-4">
          <h2 className="text-base font-semibold capitalize text-foreground">{day.dayLabel}</h2>

          <div className="space-y-5">
            {day.stages.map((stageGroup) => (
              <div key={`${day.dayKey}-${stageGroup.stage}`} className="space-y-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {stageGroup.stage}
                </p>
                <div className="space-y-2">
                  {stageGroup.matches.map((match) => (
                    <MatchScheduleRow key={match.id} match={match} teams={teams} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
