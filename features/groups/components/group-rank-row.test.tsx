// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

// Mock framer-motion — GroupRankRow uses motion.article
vi.mock("framer-motion", () => ({
  motion: {
    article: vi.fn(({ children, className, ...rest }: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) => (
      <article className={className} {...rest}>{children}</article>
    )),
    span: vi.fn(({ children, className, ...rest }: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) => (
      <span className={className} {...rest}>{children}</span>
    )),
  },
}))

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

import { GroupRankRow } from "@/features/groups/components/group-rank-row"
import type { RankingEntry } from "@/features/rankings/types"

function makeEntry(overrides: Partial<RankingEntry> = {}): RankingEntry {
  return {
    rank: 4,
    handle: "juega_david",
    name: "David Pérez",
    color: "#ff0000",
    avatarUrl: null,
    pts: 120,
    hits: 10,
    acc: 60,
    streak: 2,
    delta: 0,
    isYou: false,
    ...overrides,
  }
}

describe("GroupRankRow — Link href [4.1]", () => {
  it("renders Link to /perfil when isYou is true", () => {
    render(<GroupRankRow entry={makeEntry({ isYou: true, handle: "my_handle" })} pulse={false} showBorder={false} />)
    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("href", "/perfil")
  })

  it("renders Link to /perfil/juega_david when isYou is false", () => {
    render(<GroupRankRow entry={makeEntry({ isYou: false, handle: "juega_david" })} pulse={false} showBorder={false} />)
    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("href", "/perfil/juega_david")
  })
})
