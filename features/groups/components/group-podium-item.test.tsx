// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

// Mock next/link — renders an <a> with the correct href
vi.mock("next/link", () => ({
  default: vi.fn(({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  )),
}))

// Mock GroupAvatar — not under test
vi.mock("@/features/groups/components/group-avatar", () => ({
  GroupAvatar: vi.fn(() => <div data-testid="group-avatar" />),
}))

import { GroupPodiumItem } from "@/features/groups/components/group-podium-item"
import type { RankingEntry } from "@/features/rankings/types"

function makeEntry(overrides: Partial<RankingEntry> = {}): RankingEntry {
  return {
    rank: 1,
    handle: "juega_david",
    name: "David Pérez",
    color: "#ff0000",
    avatarUrl: null,
    pts: 350,
    hits: 20,
    acc: 75,
    streak: 5,
    delta: 0,
    isYou: false,
    ...overrides,
  }
}

describe("GroupPodiumItem — Link href [4.3]", () => {
  it("renders Link to /perfil when isYou is true", () => {
    render(<GroupPodiumItem entry={makeEntry({ isYou: true, handle: "my_handle" })} position={1} />)
    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("href", "/perfil")
  })

  it("renders Link to /perfil/juega_david when isYou is false", () => {
    render(<GroupPodiumItem entry={makeEntry({ isYou: false, handle: "juega_david" })} position={2} />)
    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("href", "/perfil/juega_david")
  })

  it("renders nothing when entry is undefined", () => {
    const { container } = render(<GroupPodiumItem entry={undefined} position={3} />)
    expect(container).toBeEmptyDOMElement()
  })
})
