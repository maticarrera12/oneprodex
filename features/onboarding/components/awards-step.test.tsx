// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen, within } from "@testing-library/react"
import { AwardsStep } from "@/features/onboarding/components/awards-step"

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}))

type PlayerOption = { api_id: number; name: string; photo_url: string | null; team_code: string | null }

const PLAYERS: Record<string, PlayerOption> = {
  messi: { api_id: 9, name: "Lionel Messi", photo_url: null, team_code: "ARG" },
  mbappe: { api_id: 7, name: "Kylian Mbappé", photo_url: null, team_code: "FRA" },
  yamal: { api_id: 33, name: "Lamine Yamal", photo_url: null, team_code: "ESP" },
}

const fetchMock = vi.fn((input: string | URL) => {
  const url = new URL(String(input), "http://localhost")
  const q = (url.searchParams.get("q") ?? "").toLowerCase()
  const data = Object.values(PLAYERS).filter((p) => p.name.toLowerCase().includes(q))
  return Promise.resolve({ ok: true, json: async () => ({ data }) })
})

function field(title: string): HTMLElement {
  const root = screen.getByText(title).parentElement
  if (!root) throw new Error(`No field found for ${title}`)
  return root
}

async function searchAndPick(title: string, query: string, playerName: string) {
  const input = within(field(title)).getByPlaceholderText(/Buscar jugador/)
  fireEvent.change(input, { target: { value: query } })
  await act(async () => {
    await vi.advanceTimersByTimeAsync(250)
  })
  fireEvent.click(within(field(title)).getByRole("button", { name: new RegExp(playerName) }))
}

const submitButton = () => screen.getByRole("button", { name: /Confirmar y enviar|Enviando/ })

function renderStep(onContinue = vi.fn().mockResolvedValue(undefined)) {
  render(<AwardsStep initialSelection={null} onContinue={onContinue} />)
  return onContinue
}

describe("AwardsStep", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.stubGlobal("fetch", fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it("debounces the search: fast typing triggers a single request with the last query", async () => {
    renderStep()
    const input = within(field("Goleador")).getByPlaceholderText("Buscar jugador...")

    fireEvent.change(input, { target: { value: "me" } })
    fireEvent.change(input, { target: { value: "mes" } })
    fireEvent.change(input, { target: { value: "messi" } })
    expect(fetchMock).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(250)
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("q=messi")
    expect(within(field("Goleador")).getByRole("button", { name: /Lionel Messi/ })).toBeInTheDocument()
  })

  it("shows the empty state when the search has no matches", async () => {
    renderStep()
    const input = within(field("Goleador")).getByPlaceholderText("Buscar jugador...")

    fireEvent.change(input, { target: { value: "zzzz" } })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250)
    })

    expect(within(field("Goleador")).getByText("Sin resultados")).toBeInTheDocument()
  })

  it("selecting a player closes the dropdown and shows the chip", async () => {
    renderStep()

    await searchAndPick("Goleador", "messi", "Lionel Messi")

    const goleador = field("Goleador")
    expect(within(goleador).getByText("Lionel Messi")).toBeInTheDocument()
    expect(within(goleador).getByText("ARG")).toBeInTheDocument()
    expect(within(goleador).queryByPlaceholderText("Buscar jugador...")).not.toBeInTheDocument()
  })

  it("requests young players only for the young player award", async () => {
    renderStep()

    const input = within(field("Mejor jugador joven")).getByPlaceholderText("Buscar jugador joven...")
    fireEvent.change(input, { target: { value: "yamal" } })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250)
    })

    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("young=1")
  })

  it("keeps submit disabled until the three awards are picked, then sends them", async () => {
    const onContinue = renderStep()

    await searchAndPick("Goleador", "messi", "Lionel Messi")
    expect(submitButton()).toBeDisabled()

    await searchAndPick("Mejor jugador", "kylian", "Kylian Mbappé")
    expect(submitButton()).toBeDisabled()

    await searchAndPick("Mejor jugador joven", "yamal", "Lamine Yamal")
    expect(submitButton()).toBeEnabled()

    fireEvent.click(submitButton())
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(onContinue).toHaveBeenCalledTimes(1)
    const formData = onContinue.mock.calls[0]?.[0] as FormData
    expect(formData.get("top_scorer_api_id")).toBe("9")
    expect(formData.get("best_player_api_id")).toBe("7")
    expect(formData.get("best_young_player_api_id")).toBe("33")
    expect(mocks.push).toHaveBeenCalledWith("/")
    expect(mocks.refresh).toHaveBeenCalled()
  })

  it("shows the error and stays on the step when submitting fails", async () => {
    const onContinue = vi.fn().mockRejectedValue(new Error("Forbidden: awards already submitted"))
    renderStep(onContinue)

    await searchAndPick("Goleador", "messi", "Lionel Messi")
    await searchAndPick("Mejor jugador", "kylian", "Kylian Mbappé")
    await searchAndPick("Mejor jugador joven", "yamal", "Lamine Yamal")

    fireEvent.click(submitButton())
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(screen.getByText("Forbidden: awards already submitted")).toBeInTheDocument()
    expect(mocks.push).not.toHaveBeenCalled()
  })
})
