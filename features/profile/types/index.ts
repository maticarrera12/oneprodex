export type ProfileAchievementTone = "lime" | "amber" | "violet" | "mute"

export type ProfileHistoryKind = "exact" | "result" | "miss"

export type ProfileHistoryPhase = "grupos" | "octavos" | "cuartos" | "semis" | "final"

export interface ProfileUser {
  name: string
  handle: string
  avatarUrl?: string | null
  joinedAt: string
  level: number
  levelTitle: string
  nextLevelTitle: string
  levelCurrent: number
  levelTarget: number
  championPick: string | null
  championPickName?: string | null
  championPickLogo?: string | null
  points: number
  rank: number
  rankOf: number
  accuracy: number
  streak: number
}

export interface ProfileHeroStat {
  label: string
  value: string
  delta?: string
  sub?: string
  fire?: boolean
}

export interface ProfileAchievement {
  id: string
  name: string
  sub: string
  progress: string
  progressRatio: number
  got: boolean
  icon: "target" | "calendar" | "trophy" | "star" | "check"
  tone: ProfileAchievementTone
  tier: 'bronze' | 'silver' | 'gold' | null
  totalTiers: number
}

export interface ProfileHistoryEntry {
  date: string
  homeTeam: string
  homeFlag: string
  homeLogo?: string | null
  awayTeam: string
  awayFlag: string
  awayLogo?: string | null
  myPrediction: string
  result: string
  pts: number
  kind: ProfileHistoryKind
  phase: ProfileHistoryPhase
}
