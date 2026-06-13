// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { OutcomeDonutChart } from "@/features/predictions/components/outcome-donut-chart"

describe("OutcomeDonutChart", () => {
  it("renders segment labels and leader in center", () => {
    render(
      <OutcomeDonutChart
        homeCode="USA"
        awayCode="PAR"
        split={{
          homePct: 20,
          drawPct: 15,
          awayPct: 65,
          homeCount: 4,
          drawCount: 3,
          awayCount: 13,
        }}
      />,
    )

    expect(screen.getByText("USA")).toBeInTheDocument()
    expect(screen.getByText("Empate")).toBeInTheDocument()
    expect(screen.getAllByText("PAR").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("65%").length).toBeGreaterThanOrEqual(1)
  })
})
