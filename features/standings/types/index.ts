export type StandingForm = "W" | "D" | "L"

export type StandingQualification = "qual" | "playoff" | "out"

export interface StandingRow {
  team: string
  pj: number
  g: number
  e: number
  p: number
  gd: number
  pts: number
  form: StandingForm[]
  qualification: StandingQualification
}

export interface GroupFixture {
  id: string
  home: string
  away: string
  hs: number | null
  as: number | null
  status: "LIVE" | "FT" | "UPCOMING"
  minute: number | null
  when: string
}

export interface GroupInsight {
  title: string
  subtitle: string
  pct: number
}

export interface StandingGroup {
  id: string
  name: string
  matchdayLabel: string
  played: number
  total: number
  rows: StandingRow[]
  fixtures: GroupFixture[]
  insight: GroupInsight
}
