// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

// Mock BracketScreen — it's a heavy "use client" component with framer-motion.
// We only need to assert it is/isn't rendered by a stub.
vi.mock("@/features/bracket/components/bracket-screen", () => ({
  BracketScreen: vi.fn(() => <div data-testid="bracket-screen">BracketScreen</div>),
}))

import { FriendBracketTab } from "@/features/bracket/components/friend-bracket-tab"
import { getBracketData } from "@/features/bracket/api"

type BracketData = NonNullable<Awaited<ReturnType<typeof getBracketData>>>

function makeBracketData(): BracketData {
  return {
    rounds: [],
    actualRounds: [],
    scoreStats: [],
    champion: { code: "ARG", name: "Argentina", logo: null, subtitle: "Predicción de campeón" },
    readOnly: true,
  }
}

describe("FriendBracketTab", () => {
  it("renders compact message when data is null (friend has no picks) [3.4]", () => {
    render(<FriendBracketTab data={null} />)
    expect(screen.getByText(/aún no completó su bracket/i)).toBeInTheDocument()
    expect(screen.queryByTestId("bracket-screen")).not.toBeInTheDocument()
  })

  it("renders BracketScreen in readOnly mode when data is present [3.4]", () => {
    render(<FriendBracketTab data={makeBracketData()} />)
    expect(screen.getByTestId("bracket-screen")).toBeInTheDocument()
    expect(screen.queryByText(/aún no completó su bracket/i)).not.toBeInTheDocument()
  })
})
