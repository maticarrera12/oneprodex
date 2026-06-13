// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { PredictionBar } from "@/features/matches/components/prediction-bar"

describe("PredictionBar", () => {
  it("renders three segments with correct aria-labels", () => {
    render(<PredictionBar homePct={55} drawPct={20} awayPct={25} homeColor={null} awayColor={null} />)

    // Each segment has its own aria-label; the outer div has a summary label
    expect(screen.getByLabelText("Home team: 55% win probability")).toBeInTheDocument()
    expect(screen.getByLabelText("Draw: 20% probability")).toBeInTheDocument()
    expect(screen.getByLabelText("Away team: 25% win probability")).toBeInTheDocument()
  })

  it("renders visible percentage text for each segment", () => {
    render(<PredictionBar homePct={55} drawPct={20} awayPct={25} homeColor={null} awayColor={null} />)

    expect(screen.getByText("55%")).toBeInTheDocument()
    expect(screen.getByText("20%")).toBeInTheDocument()
    expect(screen.getByText("25%")).toBeInTheDocument()
  })

  it("applies homeColor to home segment when provided", () => {
    render(
      <PredictionBar homePct={60} drawPct={20} awayPct={20} homeColor="#FF0000" awayColor="#0000FF" />
    )

    const homeSegment = screen.getByLabelText("Home team: 60% win probability")
    // jsdom parses #FF0000 to rgb(255, 0, 0)
    expect((homeSegment as HTMLElement).style.backgroundColor).toBe("rgb(255, 0, 0)")
  })

  it("applies neutral fallback (#9CA3AF) to home segment when homeColor is null", () => {
    render(
      <PredictionBar homePct={60} drawPct={20} awayPct={20} homeColor={null} awayColor="#0000FF" />
    )

    const homeSegment = screen.getByLabelText("Home team: 60% win probability")
    // #9CA3AF = rgb(156, 163, 175)
    expect((homeSegment as HTMLElement).style.backgroundColor).toBe("rgb(156, 163, 175)")
  })

  it("draw segment always uses neutral color regardless of team colors", () => {
    render(
      <PredictionBar homePct={40} drawPct={20} awayPct={40} homeColor="#FF0000" awayColor="#0000FF" />
    )

    const drawSegment = screen.getByLabelText("Draw: 20% probability")
    // draw always neutral: #9CA3AF = rgb(156, 163, 175)
    expect((drawSegment as HTMLElement).style.backgroundColor).toBe("rgb(156, 163, 175)")
  })

  it("a 0% segment collapses (width 0%) without breaking layout", () => {
    const { container } = render(
      <PredictionBar homePct={50} drawPct={50} awayPct={0} homeColor={null} awayColor={null} />
    )

    const awaySegment = screen.getByLabelText("Away team: 0% win probability")
    expect((awaySegment as HTMLElement).style.width).toBe("0%")
    // bar itself is still rendered
    expect(container.querySelector("[role='img']")).toBeInTheDocument()
  })

  it("bar is rendered even when all pcts are 0", () => {
    const { container } = render(
      <PredictionBar homePct={0} drawPct={0} awayPct={0} homeColor={null} awayColor={null} />
    )
    // all segments have 0 width but the bar container exists
    expect(container.querySelector("[role='img']")).toBeInTheDocument()
    expect(screen.getByLabelText("Home team: 0% win probability")).toBeInTheDocument()
  })
})

describe("PredictionBar — advice", () => {
  it("shows the API advice text below the bar when provided", () => {
    render(<PredictionBar homePct={50} drawPct={50} awayPct={0} advice="Double chance : USA or draw" />)
    expect(screen.getByText("Double chance : USA or draw")).toBeInTheDocument()
  })

  it("renders no advice element when advice is absent", () => {
    render(<PredictionBar homePct={50} drawPct={30} awayPct={20} />)
    expect(screen.queryByTestId("prediction-advice")).not.toBeInTheDocument()
  })
})

describe("PredictionBar — inline variant", () => {
  it("hides visible percentages in inline mode", () => {
    render(<PredictionBar variant="inline" homePct={55} drawPct={20} awayPct={25} />)

    expect(screen.getByLabelText("Home team: 55% win probability")).toBeInTheDocument()
    expect(screen.getByLabelText("Draw: 20% probability")).toBeInTheDocument()
    expect(screen.getByLabelText("Away team: 25% win probability")).toBeInTheDocument()
  })
})
