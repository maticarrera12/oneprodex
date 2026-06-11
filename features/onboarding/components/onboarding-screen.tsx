"use client"

import { useMemo } from "react"
import {
  saveBestThirds,
  saveBracketPicks,
  saveGroupPicks,
  saveTournamentPredictions,
  setOnboardingMode,
  saveMatchScorePick,
  continueFromProdePicks,
  resetOnboardingMode,
} from "@/features/onboarding/actions"
import { BestThirdsStep } from "@/features/onboarding/components/best-thirds-step"
import { BracketStep } from "@/features/onboarding/components/bracket-step"
import { GroupPicksStep } from "@/features/onboarding/components/group-picks-step"
import { ModeSelectScreen } from "@/features/onboarding/components/mode-select-screen"
import { ProdePicksScreen } from "@/features/onboarding/components/prode-picks-screen"
import { ProgressBar } from "@/features/onboarding/components/progress-bar"
import { AwardsStep } from "@/features/onboarding/components/awards-step"
import type { GroupCode, OnboardingState, OnboardingStep, OnboardingTeam, ThirdPlaceTeam } from "@/features/onboarding/types"
import type { MatchWithPrediction } from "@/features/onboarding/components/prode-picks-screen"

type OnboardingScreenProps = {
  step: OnboardingStep
  savedData: Omit<OnboardingState, "step">
  teamsByGroup?: Partial<Record<GroupCode, OnboardingTeam[]>>
  matchesByGroup?: Partial<Record<GroupCode, MatchWithPrediction[]>>
}

const ALL_GROUPS: GroupCode[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]

function normalizeTeamsByGroup(
  source: Partial<Record<GroupCode, OnboardingTeam[]>> | undefined,
  rankings: OnboardingState["groupRankings"],
  groups: GroupCode[]
): Record<GroupCode, OnboardingTeam[]> {
  return groups.reduce(
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
      acc[group] = fromRanking
      return acc
    },
    {} as Record<GroupCode, OnboardingTeam[]>
  )
}

function deriveThirdPlaceTeams(
  groupRankings: OnboardingState["groupRankings"],
  teamsByGroup: Record<GroupCode, OnboardingTeam[]>,
  groups: GroupCode[]
): ThirdPlaceTeam[] {
  return groups.map((group) => {
    const teamCode = groupRankings?.[group]?.[2] ?? teamsByGroup[group]?.[2]?.code ?? `${group}3`
    const teamMeta = teamsByGroup[group]?.find((team) => team.code === teamCode)
    return {
      group_code: group,
      team_code: teamCode,
      name: teamMeta?.name ?? teamCode,
      logo: teamMeta?.logo ?? null,
    }
  })
}

export function OnboardingScreen({ step, savedData, teamsByGroup, matchesByGroup }: OnboardingScreenProps) {
  const normalizedTeams = useMemo(
    () => normalizeTeamsByGroup(teamsByGroup, savedData.groupRankings, ALL_GROUPS),
    [savedData.groupRankings, teamsByGroup]
  )
  const logoByCode = useMemo(() => {
    const map = new Map<string, string>()
    for (const group of ALL_GROUPS) {
      for (const team of normalizedTeams[group]) {
        if (team.logo) {
          map.set(team.code.trim().toUpperCase(), team.logo)
        }
      }
    }
    return map
  }, [normalizedTeams])
  const thirdPlaceTeams = useMemo(
    () => deriveThirdPlaceTeams(savedData.groupRankings, normalizedTeams, ALL_GROUPS),
    [normalizedTeams, savedData.groupRankings]
  )

  // Derive numeric step for ProgressBar (quick mode only)
  const quickStep = step.status === "quick_step" ? step.step : null

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 py-4 pb-28">
      {quickStep !== null && <ProgressBar currentStep={quickStep} />}

      {step.status === "mode_select" ? (
        <ModeSelectScreen onSelect={setOnboardingMode} />
      ) : null}

      {step.status === "prode_picks" ? (
        <ProdePicksScreen
          matchesByGroup={matchesByGroup ?? {}}
          filled={step.filled}
          total={step.total}
          onSave={saveMatchScorePick}
          onSaveAndExit={continueFromProdePicks}
          logoByCode={logoByCode}
        />
      ) : null}

      {step.status === "quick_step" && step.step === 1 ? (
        <GroupPicksStep groups={ALL_GROUPS} teamsByGroup={normalizedTeams} initialRankings={savedData.groupRankings} onContinue={saveGroupPicks} />
      ) : null}

      {step.status === "quick_step" && step.step === 2 ? (
        <BestThirdsStep teams={thirdPlaceTeams} initialSelected={savedData.bestThirds} onContinue={saveBestThirds} />
      ) : null}

      {step.status === "quick_step" && step.step === 3 && savedData.groupRankings ? (
        <BracketStep
          groupRankings={savedData.groupRankings}
          bestThirds={savedData.bestThirds ?? []}
          initialPicks={savedData.bracketPicks}
          logoByCode={logoByCode}
          onContinue={saveBracketPicks}
          onBack={resetOnboardingMode}
        />
      ) : null}

      {step.status === "quick_step" && step.step === 4 ? (
        <AwardsStep initialSelection={savedData.tournamentPredictions} onContinue={saveTournamentPredictions} />
      ) : null}

      {step.status === "bracket" && savedData.groupRankings ? (
        <BracketStep
          groupRankings={savedData.groupRankings}
          bestThirds={savedData.bestThirds ?? []}
          initialPicks={savedData.bracketPicks}
          logoByCode={logoByCode}
          onContinue={saveBracketPicks}
          onBack={resetOnboardingMode}
        />
      ) : null}

      {step.status === "awards" ? (
        <AwardsStep initialSelection={savedData.tournamentPredictions} onContinue={saveTournamentPredictions} />
      ) : null}
    </div>
  )
}
