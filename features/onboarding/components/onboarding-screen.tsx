"use client"

import { useMemo } from "react"
import {
  saveBestThirds,
  saveBracketPicks,
  saveGroupPicks,
  saveTournamentPredictions,
} from "@/features/onboarding/actions"
import { BestThirdsStep } from "@/features/onboarding/components/best-thirds-step"
import { BracketStep } from "@/features/onboarding/components/bracket-step"
import { GroupPicksStep } from "@/features/onboarding/components/group-picks-step"
import { ProgressBar } from "@/features/onboarding/components/progress-bar"
import { AwardsStep } from "@/features/onboarding/components/awards-step"
import type { GroupCode, OnboardingState, OnboardingTeam, ThirdPlaceTeam } from "@/features/onboarding/types"

type OnboardingScreenProps = {
  step: 1 | 2 | 3 | 4
  savedData: Omit<OnboardingState, "step">
  teamsByGroup?: Partial<Record<GroupCode, OnboardingTeam[]>>
}

const GROUPS: GroupCode[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]

function buildFallbackTeams(group: GroupCode): OnboardingTeam[] {
  return Array.from({ length: 4 }, (_, index) => {
    const code = `${group}${index + 1}`
    return {
      code,
      name: `Equipo ${code}`,
      logo: null,
    }
  })
}

function normalizeTeamsByGroup(
  source: Partial<Record<GroupCode, OnboardingTeam[]>> | undefined,
  rankings: OnboardingState["groupRankings"]
): Record<GroupCode, OnboardingTeam[]> {
  return GROUPS.reduce(
    (acc, group) => {
      const existing = source?.[group]
      if (existing && existing.length > 0) {
        acc[group] = existing
        return acc
      }

      const fromRanking = (rankings?.[group] ?? []).filter(Boolean).map((code) => ({
        code,
        name: code,
        logo: null,
      }))
      acc[group] = fromRanking.length > 0 ? fromRanking : buildFallbackTeams(group)
      return acc
    },
    {} as Record<GroupCode, OnboardingTeam[]>
  )
}

function deriveThirdPlaceTeams(
  groupRankings: OnboardingState["groupRankings"],
  teamsByGroup: Record<GroupCode, OnboardingTeam[]>
): ThirdPlaceTeam[] {
  return GROUPS.map((group) => {
    const teamCode = groupRankings?.[group]?.[2] ?? teamsByGroup[group]?.[2]?.code ?? `${group}3`
    const teamMeta = teamsByGroup[group].find((team) => team.code === teamCode)
    return {
      group_code: group,
      team_code: teamCode,
      name: teamMeta?.name ?? teamCode,
      logo: teamMeta?.logo ?? null,
    }
  })
}

export function OnboardingScreen({ step, savedData, teamsByGroup }: OnboardingScreenProps) {
  const normalizedTeams = useMemo(
    () => normalizeTeamsByGroup(teamsByGroup, savedData.groupRankings),
    [savedData.groupRankings, teamsByGroup]
  )
  const thirdPlaceTeams = useMemo(
    () => deriveThirdPlaceTeams(savedData.groupRankings, normalizedTeams),
    [normalizedTeams, savedData.groupRankings]
  )

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 py-4 pb-28">
      <ProgressBar currentStep={step} />

      {step === 1 ? (
        <GroupPicksStep teamsByGroup={normalizedTeams} initialRankings={savedData.groupRankings} onContinue={saveGroupPicks} />
      ) : null}

      {step === 2 ? (
        <BestThirdsStep teams={thirdPlaceTeams} initialSelected={savedData.bestThirds} onContinue={saveBestThirds} />
      ) : null}

      {step === 3 && savedData.groupRankings ? (
        <BracketStep
          groupRankings={savedData.groupRankings}
          bestThirds={savedData.bestThirds ?? []}
          initialPicks={savedData.bracketPicks}
          onContinue={saveBracketPicks}
        />
      ) : null}

      {step === 4 ? (
        <AwardsStep initialSelection={savedData.tournamentPredictions} onContinue={saveTournamentPredictions} />
      ) : null}
    </div>
  )
}
