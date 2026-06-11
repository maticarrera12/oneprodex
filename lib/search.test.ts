import { describe, expect, it } from "vitest"
import { normalizeSearchText } from "@/lib/search"

describe("normalizeSearchText", () => {
  it("lowercases and trims", () => {
    expect(normalizeSearchText("  MESSI ")).toBe("messi")
  })

  it("strips Latin diacritics", () => {
    expect(normalizeSearchText("Mbappé")).toBe("mbappe")
    expect(normalizeSearchText("Muñoz")).toBe("munoz")
    expect(normalizeSearchText("Güler")).toBe("guler")
  })

  it("maps characters without a decomposed form like unaccent does", () => {
    expect(normalizeSearchText("Sørloth")).toBe("sorloth")
    expect(normalizeSearchText("Großkreutz")).toBe("grosskreutz")
    expect(normalizeSearchText("Błaszczykowski")).toBe("blaszczykowski")
    expect(normalizeSearchText("Højbjerg")).toBe("hojbjerg")
  })

  it("keeps plain ascii untouched", () => {
    expect(normalizeSearchText("yamal")).toBe("yamal")
  })
})
