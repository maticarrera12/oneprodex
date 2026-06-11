// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { ProdePicksScreen, type MatchWithPrediction } from "@/features/onboarding/components/prode-picks-screen"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

function buildItem(): MatchWithPrediction {
  return {
    match: {
      id: "m1",
      home_team_code: "ARG",
      away_team_code: "MEX",
      group_code: "A",
      kickoff: "2026-06-11T18:00:00+00:00",
    },
    prediction: null,
  }
}

function renderScreen(onSave: (formData: FormData) => Promise<void>) {
  render(
    <ProdePicksScreen
      matchesByGroup={{ A: [buildItem()] }}
      filled={0}
      total={72}
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

    expect(screen.getByText("0 de 72 completados · Podés seguir antes de que arranque cada partido")).toBeInTheDocument()

    addHome()
    addAway()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600)
    })
    expect(screen.getByText(/1 de 72 completados/)).toBeInTheDocument()

    // editing the same match again must not double-count it
    addHome()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600)
    })
    expect(onSave).toHaveBeenCalledTimes(2)
    expect(screen.getByText(/1 de 72 completados/)).toBeInTheDocument()
  })
})
