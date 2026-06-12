// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { ProdePicksScreen, type MatchWithPrediction } from "@/features/onboarding/components/prode-picks-screen"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

const TOTAL = 5

function buildItem(overrides?: Partial<MatchWithPrediction["match"]> & { prediction?: MatchWithPrediction["prediction"] }): MatchWithPrediction {
  const { prediction = null, ...matchOverrides } = overrides ?? {}
  return {
    match: {
      id: "m1",
      home_team_code: "ARG",
      away_team_code: "MEX",
      group_code: "A",
      kickoff: "2026-06-11T18:00:00+00:00",
      ...matchOverrides,
    },
    prediction,
  }
}

function renderScreen(onSave: (formData: FormData) => Promise<void>, item?: MatchWithPrediction) {
  render(
    <ProdePicksScreen
      matchesByGroup={{ A: [item ?? buildItem()] }}
      filled={0}
      total={TOTAL}
      onSave={onSave}
      onSaveAndExit={vi.fn().mockResolvedValue(undefined)}
    />
  )
}

const addHome = () => fireEvent.click(screen.getByLabelText("Sumar gol local"))
const addAway = () => fireEvent.click(screen.getByLabelText("Sumar gol visitante"))

describe("ProdePicksScreen autosave", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("fires a single autosave with the final score after the debounce", async () => {
    const onSave = vi.fn((_formData: FormData) => Promise.resolve())
    renderScreen(onSave)

    // away tap schedules a 0-0 save; the home tap right after must
    // reschedule it as 1-0, not let both fire
    addHome()
    addAway()
    addHome()
    expect(onSave).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600)
    })

    expect(onSave).toHaveBeenCalledTimes(1)
    const formData = onSave.mock.calls[0]?.[0] as FormData
    expect(formData.get("match_id")).toBe("m1")
    expect(formData.get("home_score")).toBe("1")
    expect(formData.get("away_score")).toBe("0")
  })

  it("disables score buttons while a save is in flight", async () => {
    let resolveSave: () => void = () => {}
    const onSave = vi.fn(
      (_formData: FormData) =>
        new Promise<void>((resolve) => {
          resolveSave = resolve
        })
    )
    renderScreen(onSave)

    addHome()
    addAway()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600)
    })

    expect(screen.getByLabelText("Sumar gol local")).toBeDisabled()
    expect(screen.getByLabelText("Sumar gol visitante")).toBeDisabled()

    await act(async () => {
      resolveSave()
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(screen.getByLabelText("Sumar gol local")).toBeEnabled()
    expect(screen.getByText("✓")).toBeInTheDocument()
  })

  it("maps a locked save failure to the explanatory message", async () => {
    const onSave = vi.fn((_formData: FormData) => Promise.reject(new Error("Prediction locked")))
    renderScreen(onSave)

    addHome()
    addAway()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600)
    })

    expect(screen.getByText("El resultado ya fue guardado y no se puede cambiar.")).toBeInTheDocument()
    expect(screen.getByText("!")).toBeInTheDocument()
  })

  it("increments progress only on the first successful save of a match", async () => {
    const onSave = vi.fn((_formData: FormData) => Promise.resolve())
    renderScreen(onSave)

    expect(screen.getByText(`0 de ${TOTAL} completados · Podés seguir antes de que arranque cada partido`)).toBeInTheDocument()

    addHome()
    addAway()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600)
    })
    expect(screen.getByText(new RegExp(`1 de ${TOTAL} completados`))).toBeInTheDocument()

    // editing the same match again must not double-count it
    addHome()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600)
    })
    expect(onSave).toHaveBeenCalledTimes(2)
    expect(screen.getByText(new RegExp(`1 de ${TOTAL} completados`))).toBeInTheDocument()
  })
})

describe("MatchRow variants", () => {
  it("LIVE match: shows 'En juego' badge and no stepper buttons", () => {
    const item = buildItem({ status: "LIVE" })
    renderScreen(vi.fn(), item)

    expect(screen.getByText("En juego")).toBeInTheDocument()
    expect(screen.queryByLabelText("Sumar gol local")).not.toBeInTheDocument()
    expect(screen.queryByLabelText("Sumar gol visitante")).not.toBeInTheDocument()
    expect(screen.queryByLabelText("Restar gol local")).not.toBeInTheDocument()
    expect(screen.queryByLabelText("Restar gol visitante")).not.toBeInTheDocument()
  })

  it("FINISHED match with no user prediction: shows real scores greyed with 'Resultado real' and no steppers", () => {
    const item = buildItem({ status: "FINISHED", home_score: 2, away_score: 1, prediction: null })
    renderScreen(vi.fn(), item)

    expect(screen.getByText("Resultado real")).toBeInTheDocument()
    // Real scores are displayed
    expect(screen.getByText("2")).toBeInTheDocument()
    expect(screen.getByText("1")).toBeInTheDocument()
    // No stepper buttons
    expect(screen.queryByLabelText("Sumar gol local")).not.toBeInTheDocument()
    expect(screen.queryByLabelText("Sumar gol visitante")).not.toBeInTheDocument()
    // null is never rendered as a visible score value
    expect(screen.queryByText("null")).not.toBeInTheDocument()
  })

  it("FINISHED match with user prediction: shows user's saved scores, no 'Resultado real', no steppers", () => {
    const item = buildItem({
      status: "FINISHED",
      home_score: 2,
      away_score: 1,
      prediction: { home_score: 0, away_score: 0 },
    })
    renderScreen(vi.fn(), item)

    // User's prediction is shown (0–0), NOT the real score (2–1)
    const scoreDisplays = screen.getAllByText("0")
    expect(scoreDisplays.length).toBeGreaterThanOrEqual(2)
    // "Resultado real" must NOT appear
    expect(screen.queryByText("Resultado real")).not.toBeInTheDocument()
    // Stepper buttons must NOT appear
    expect(screen.queryByLabelText("Sumar gol local")).not.toBeInTheDocument()
    expect(screen.queryByLabelText("Sumar gol visitante")).not.toBeInTheDocument()
  })

  it("UPCOMING match renders the standard open variant with steppers", () => {
    const item = buildItem({ status: "UPCOMING" })
    renderScreen(vi.fn(), item)

    expect(screen.getByLabelText("Sumar gol local")).toBeInTheDocument()
    expect(screen.getByLabelText("Sumar gol visitante")).toBeInTheDocument()
    expect(screen.queryByText("En juego")).not.toBeInTheDocument()
    expect(screen.queryByText("Resultado real")).not.toBeInTheDocument()
  })
})
