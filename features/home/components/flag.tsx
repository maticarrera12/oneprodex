import { TEAMS } from "@/features/matches/mock"

type FlagProps = {
  code: string
  size?: number
}

const horizontalCodes = new Set(["ARG", "GER", "NED", "ESP", "FRA"])

export function Flag({ code, size = 28 }: FlagProps) {
  const team = TEAMS[code]
  if (!team) {
    return (
      <span
        className="inline-flex rounded-full bg-muted"
        aria-hidden="true"
        style={{ width: size, height: size }}
      />
    )
  }

  const direction = horizontalCodes.has(code) ? "180deg" : "90deg"
  const stripe = `linear-gradient(${direction}, ${team.c1} 0% 33.33%, ${team.c2} 33.33% 66.66%, ${team.c3} 66.66% 100%)`

  return (
    <span
      aria-label={`Bandera ${team.name}`}
      title={team.name}
      className="inline-flex rounded-full border border-white/20 shadow-[0_0_0_1px_rgba(0,0,0,0.2)]"
      style={{ background: stripe, width: size, height: size }}
    />
  )
}
