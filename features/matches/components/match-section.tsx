import { TEAMS } from "@/features/matches/mock"
import { MatchCard } from "@/features/matches/components/match-card"
import type { Match } from "@/features/matches/types"

type MatchSectionProps = {
  title: string
  matches: Match[]
}

export default function MatchSection({ title, matches }: MatchSectionProps) {
  return (
    <section>
      <h2 className="mb-3 text-xs font-mono tracking-wider text-(--color-text3) uppercase">{title}</h2>
      <div className="space-y-3">
        {matches.map((match, index) => (
          <MatchCard key={match.id} match={match} teams={TEAMS} index={index} />
        ))}
      </div>
    </section>
  )
}
