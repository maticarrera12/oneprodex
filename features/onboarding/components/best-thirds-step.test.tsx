// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { BestThirdsStep } from "@/features/onboarding/components/best-thirds-step"
import type { ThirdPlaceTeam } from "@/features/onboarding/types"

const ALL_GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"] as const

const TEAMS: ThirdPlaceTeam[] = ALL_GROUPS.map((group) => ({
  group_code: group,
  team_code: `${group}3`,
  name: `Team ${group}3`,
  logo: null,
}))

const teamButton = (group: string) => screen.getByRole("button", { name: new RegExp(`Team ${group}3`) })
const submitButton = () => screen.getByRole("button", { name: /Confirmar y continuar|Guardando/ })

function renderStep(onContinue = vi.fn().mockResolvedValue(undefined), initialSelected: string[] | null = null) {
  render(<BestThirdsStep teams={TEAMS} initialSelected={initialSelected} onContinue={onContinue} />)
  return onContinue
}

function selectGroups(groups: readonly string[]) {
  for (const group of groups) fireEvent.click(teamButton(group))
}

describe("BestThirdsStep", () => {
  it("tracks the selection counter and allows deselecting", () => {
    renderStep()

    expect(screen.getByText("0/8")).toBeInTheDocument()
    fireEvent.click(teamButton("A"))
    fireEvent.click(teamButton("B"))
    expect(screen.getByText("2/8")).toBeInTheDocument()

    fireEvent.click(teamButton("A"))
    expect(screen.getByText("1/8")).toBeInTheDocument()
  })

  it("blocks further picks at 8 but keeps selected ones toggleable", () => {
    renderStep()

    selectGroups(ALL_GROUPS.slice(0, 8))

    expect(screen.getByText("8/8")).toBeInTheDocument()
    expect(teamButton("I")).toBeDisabled()
    expect(teamButton("A")).toBeEnabled()
  })

  it("keeps submit disabled until exactly 8 are selected, then sends them", async () => {
    const onContinue = renderStep()

    selectGroups(ALL_GROUPS.slice(0, 7))
    expect(submitButton()).toBeDisabled()

    fireEvent.click(teamButton("H"))
    expect(submitButton()).toBeEnabled()

    fireEvent.click(submitButton())
    expect(await screen.findByRole("button", { name: /Confirmar y continuar/ })).toBeInTheDocument()

    expect(onContinue).toHaveBeenCalledTimes(1)
    const formData = onContinue.mock.calls[0]?.[0] as FormData
    const codes = JSON.parse(String(formData.get("team_codes"))) as string[]
    expect(codes).toHaveLength(8)
    expect(new Set(codes).size).toBe(8)
  })

  it("hydrates from a previous selection", () => {
    renderStep(vi.fn(), ["A3", "B3", "C3", "D3", "E3", "F3", "G3", "H3"])

    expect(screen.getByText("8/8")).toBeInTheDocument()
    expect(submitButton()).toBeEnabled()
  })

  it("shows an error when saving fails", async () => {
    const onContinue = vi.fn().mockRejectedValue(new Error("Step 1 incomplete"))
    renderStep(onContinue)

    selectGroups(ALL_GROUPS.slice(0, 8))
    fireEvent.click(submitButton())

    expect(await screen.findByText("Step 1 incomplete")).toBeInTheDocument()
  })
})
