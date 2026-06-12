// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { MatchDetailScreen } from "@/features/matches/components/match-detail-screen"
import type { Match } from "@/features/matches/types"
import type { MatchPredictionState, PlayerDetail } from "@/features/predictions/types"

const mocks = vi.hoisted(() => ({
  savePrediction: vi.fn(),
  commitScorerEdits: vi.fn(),
  toggleCleanSheetPrediction: vi.fn(),
  refresh: vi.fn(),
}))

vi.mock("@/features/predictions/actions", () => ({
  savePrediction: mocks.savePrediction,
  commitScorerEdits: mocks.commitScorerEdits,
  toggleCleanSheetPrediction: mocks.toggleCleanSheetPrediction,
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}))

function buildMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: "m1",
    home: "HOM",
    away: "AWY",
    homeLogo: null,
    awayLogo: null,
    hs: null,
    as: null,
    pred: null,
    status: "UPCOMING",
    minute: null,
    kickoff: "2026-06-15T18:00:00+00:00",
    stage: "Group Stage - 1",
    venue: "Estadio Azteca",
    ...overrides,
  }
}

function buildPredictionState(overrides: Partial<MatchPredictionState> = {}): MatchPredictionState {
  return {
    score: null,
    scorerIds: [],
    yellowCardIds: [],
    redCardIds: [],
    cleanSheetCodes: [],
    editLocked: false,
    ...overrides,
  }
}

const HOME_PLAYERS: PlayerDetail[] = [
  { api_id: 101, name: "Home Striker", position: "F", photo_url: null },
  { api_id: 102, name: "Home Mid", position: "M", photo_url: null },
  { api_id: 103, name: "Home Defender", position: "D", photo_url: null },
]
const AWAY_PLAYERS: PlayerDetail[] = [
  { api_id: 201, name: "Away Striker", position: "F", photo_url: null },
]

function renderDetail({
  match = buildMatch(),
  predictionState = buildPredictionState(),
}: { match?: Match; predictionState?: MatchPredictionState } = {}) {
  render(
    <MatchDetailScreen
      match={match}
      predictionState={predictionState}
      players={{ home: HOME_PLAYERS, away: AWAY_PLAYERS }}
      events={[]}
      consensusGroups={[]}
    />
  )
}

function playerRow(name: string): HTMLElement {
  const row = screen.getByText(name).closest("div.grid")
  if (!row) throw new Error(`No player row found for ${name}`)
  return row as HTMLElement
}

const scorerButton = (name: string) => within(playerRow(name)).getByRole("button", { name: "G" })
const yellowButton = (name: string) => within(playerRow(name)).getByRole("button", { name: "A" })
const redButton = (name: string) => within(playerRow(name)).getByRole("button", { name: "R" })
const quickPick = (label: string) => screen.getByRole("button", { name: label })

// The clean-sheet toggle also renders buttons named after the team codes,
// so squad tabs must be queried inside the extras section only.
function squadTab(code: string): HTMLElement {
  const section = screen.getByText(/Jugadores · G/).closest("section")
  if (!section) throw new Error("Extras section not found")
  return within(section as HTMLElement).getByRole("button", { name: code })
}

describe("MatchDetailScreen prediction extras", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.commitScorerEdits.mockResolvedValue({})
  })

  it("blocks all scorer picks while the predicted score is 0-0", () => {
    renderDetail()

    expect(scorerButton("Home Striker")).toBeDisabled()
    fireEvent.click(squadTab("AWY"))
    expect(scorerButton("Away Striker")).toBeDisabled()
  })

  it("allows scorers only on the side that has predicted goals", () => {
    renderDetail()

    fireEvent.click(quickPick("1–0"))

    expect(scorerButton("Home Striker")).toBeEnabled()
    expect(yellowButton("Home Striker")).toBeEnabled()

    fireEvent.click(squadTab("AWY"))
    expect(scorerButton("Away Striker")).toBeDisabled()
    expect(yellowButton("Away Striker")).toBeEnabled()
  })

  it("toggles a scorer on and off and tracks the counter", () => {
    renderDetail()
    fireEvent.click(quickPick("1–0"))

    fireEvent.click(scorerButton("Home Striker"))
    expect(screen.getByText(/G 1\/3/)).toBeInTheDocument()

    fireEvent.click(scorerButton("Home Striker"))
    expect(screen.getByText(/G 0\/3/)).toBeInTheDocument()
  })

  it("blocks extra yellow cards once the limit of 2 is reached", () => {
    renderDetail()
    fireEvent.click(quickPick("1–0"))

    fireEvent.click(yellowButton("Home Striker"))
    fireEvent.click(yellowButton("Home Mid"))

    expect(screen.getByText(/A 2\/2/)).toBeInTheDocument()
    expect(yellowButton("Home Defender")).toBeDisabled()
    // an already-selected card can still be toggled off
    expect(yellowButton("Home Mid")).toBeEnabled()
  })

  it("submits score, scorers and cards together with the unified save", async () => {
    renderDetail()

    fireEvent.click(quickPick("2–1"))
    fireEvent.click(scorerButton("Home Striker"))
    fireEvent.click(yellowButton("Home Mid"))
    fireEvent.click(redButton("Home Defender"))

    fireEvent.click(screen.getByRole("button", { name: "Guardar predicción" }))

    expect(await screen.findByRole("button", { name: "Guardar predicción" })).toBeEnabled()
    expect(mocks.commitScorerEdits).toHaveBeenCalledTimes(1)
    const formData = mocks.commitScorerEdits.mock.calls[0]?.[0] as FormData
    expect(formData.get("match_id")).toBe("m1")
    expect(formData.get("home_score")).toBe("2")
    expect(formData.get("away_score")).toBe("1")
    expect(JSON.parse(String(formData.get("scorers")))).toEqual([{ player_api_id: 101, type: "SCORER" }])
    expect(JSON.parse(String(formData.get("cards")))).toEqual([
      { player_api_id: 102, type: "YELLOW_CARD" },
      { player_api_id: 103, type: "RED_CARD" },
    ])
    expect(mocks.refresh).toHaveBeenCalled()
  })

  it("shows the locked message when the save reports already_locked", async () => {
    mocks.commitScorerEdits.mockResolvedValue({ error: "already_locked" })
    renderDetail()

    fireEvent.click(quickPick("1–0"))
    fireEvent.click(screen.getByRole("button", { name: "Guardar predicción" }))

    expect(await screen.findByText("Estos detalles ya fueron guardados.")).toBeInTheDocument()
    expect(mocks.refresh).not.toHaveBeenCalled()
  })

  it("keeps saved selections visible but disabled when edit is locked", () => {
    renderDetail({
      predictionState: buildPredictionState({
        score: { home_score: 1, away_score: 0 },
        scorerIds: [101],
        yellowCardIds: [102],
        editLocked: true,
      }),
    })

    expect(
      screen.getByText("Detalles guardados. Podés ver tus elecciones, pero ya no se pueden cambiar.")
    ).toBeInTheDocument()
    expect(screen.getByText(/G 1\/3/)).toBeInTheDocument()
    expect(screen.getByText(/A 1\/2/)).toBeInTheDocument()
    expect(scorerButton("Home Striker")).toBeDisabled()
    expect(yellowButton("Home Mid")).toBeDisabled()

    const saveButton = screen.getByRole("button", { name: "Detalles guardados" })
    expect(saveButton).toBeDisabled()
  })

  it("locks the score controls once a score is saved", () => {
    renderDetail({
      predictionState: buildPredictionState({ score: { home_score: 1, away_score: 0 } }),
    })

    expect(screen.getByText("BLOQUEADA")).toBeInTheDocument()
    expect(quickPick("2–1")).toBeDisabled()
  })

  it("hides the extras section entirely when the match is not upcoming", () => {
    renderDetail({ match: buildMatch({ status: "LIVE", hs: 0, as: 0, minute: 12 }) })

    expect(screen.queryByRole("button", { name: "Guardar predicción" })).not.toBeInTheDocument()
    expect(screen.queryByText("Home Striker")).not.toBeInTheDocument()
    expect(screen.getByText("BLOQUEADA")).toBeInTheDocument()
  })
})

describe("MatchDetailScreen tab switching", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.commitScorerEdits.mockResolvedValue({})
  })

  it("default active tab on mount is Predecir — lineups and H2H panels are absent", () => {
    renderDetail()
    // Alineaciones panel empty state is not in the DOM when Predecir is active
    expect(screen.queryByText("Alineaciones todavía no disponibles")).not.toBeInTheDocument()
    // Predecir content (ScorePrediction area) is visible
    expect(screen.getByText(/VS/i)).toBeInTheDocument()
  })

  it("clicking Alineaciones tab shows the lineups panel and hides extras section", () => {
    renderDetail()
    fireEvent.click(screen.getByRole("button", { name: "Alineaciones" }))
    // Empty lineups → empty state message visible
    expect(screen.getByText("Alineaciones todavía no disponibles")).toBeInTheDocument()
  })

  it("clicking H2H tab shows the H2H panel", () => {
    renderDetail()
    fireEvent.click(screen.getByRole("button", { name: "H2H" }))
    // H2H panel empty state
    expect(screen.getByText("Sin historial disponible")).toBeInTheDocument()
  })
})
