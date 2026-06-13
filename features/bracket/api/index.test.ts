import { describe, expect, it, vi } from "vitest"
import { getBracketData } from "@/features/bracket/api"

// ---------------------------------------------------------------------------
// Supabase mock helpers
// ---------------------------------------------------------------------------

type AnyResult = { data: unknown; error: unknown }

/**
 * Returns a Supabase-style query builder where:
 * - All chainable methods (eq, in, gte, lt, etc.) return `this`
 * - Terminal resolution happens via `then` (the chain is a thenable/Promise-like)
 * - `.order()` returns the same chain so it can be chained again AND awaited
 * - `.maybeSingle()` resolves
 *
 * This avoids infinite recursion by using a single shared object and `Object.assign`.
 */
function makeQueryChain(resolveValue: AnyResult) {
  const promise = Promise.resolve(resolveValue)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: Record<string, any> = {
    // Chainable filters — all return `this`
    eq: function () { return chain },
    neq: function () { return chain },
    in: function () { return chain },
    not: function () { return chain },
    gte: function () { return chain },
    gt: function () { return chain },
    lt: function () { return chain },
    lte: function () { return chain },
    or: function () { return chain },
    filter: function () { return chain },
    is: function () { return chain },

    // `.order()` returns `this` so `.order().order()` works,
    // and the chain is awaitable via `.then`
    order: function () { return chain },

    // `.limit()` resolves
    limit: vi.fn().mockResolvedValue(resolveValue),

    // `.maybeSingle()` resolves
    maybeSingle: vi.fn().mockResolvedValue(resolveValue),

    // Make the chain a thenable so `await chain` resolves
    then: (onfulfilled: Parameters<Promise<AnyResult>["then"]>[0]) =>
      promise.then(onfulfilled),
    catch: (onrejected: Parameters<Promise<AnyResult>["catch"]>[0]) =>
      promise.catch(onrejected),
    finally: (onfinally: Parameters<Promise<AnyResult>["finally"]>[0]) =>
      promise.finally(onfinally),
  }

  return chain
}

/**
 * Minimal Supabase mock for `getBracketData`.
 *
 * The only query result that matters for this test is `bracket_picks`.
 * All other tables return safe empty data.
 */
function buildBracketMock(options: {
  picks: Array<{ slot: string; team_code: string }>
  picksError?: { message: string } | null
}) {
  const picksResult: AnyResult = {
    data: options.picksError ? null : options.picks,
    error: options.picksError ?? null,
  }

  const safeEmpty: AnyResult = { data: [], error: null }
  const safeNull: AnyResult = { data: null, error: null }

  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "bracket_picks") {
        return { select: vi.fn().mockReturnValue(makeQueryChain(picksResult)) }
      }
      if (table === "users") {
        return { select: vi.fn().mockReturnValue(makeQueryChain(safeNull)) }
      }
      if (table === "teams") {
        // select() resolves directly (no chain)
        return { select: vi.fn().mockResolvedValue(safeEmpty) }
      }
      // group_picks, matches
      return { select: vi.fn().mockReturnValue(makeQueryChain(safeEmpty)) }
    }),
  }
}

// ---------------------------------------------------------------------------
// Tests — tasks 3.1 (RED) → 3.2 (GREEN)
// ---------------------------------------------------------------------------

describe("getBracketData", () => {
  it("returns null when bracket_picks is empty (zero picks) [3.1/3.2]", async () => {
    const supabase = buildBracketMock({ picks: [] })
    const result = await getBracketData(supabase as never, "user-zero-picks")
    expect(result).toBeNull()
  })

  it("returns null when bracket_picks query returns a DB error (existing behaviour)", async () => {
    const supabase = buildBracketMock({ picks: [], picksError: { message: "DB error" } })
    const result = await getBracketData(supabase as never, "user-db-error")
    expect(result).toBeNull()
  })

  it("returns BracketData (not null) when bracket_picks has at least one pick", async () => {
    const supabase = buildBracketMock({
      picks: [{ slot: "R32_P1", team_code: "ARG" }],
    })
    const result = await getBracketData(supabase as never, "user-with-picks")
    expect(result).not.toBeNull()
    expect(result?.rounds).toBeDefined()
  })
})
