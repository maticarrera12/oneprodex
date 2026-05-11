export type ProfileAchievementTone = "lime" | "amber" | "violet" | "mute"

export type ProfileHistoryKind = "exact" | "result" | "miss"

export interface ProfileUser {
  name: string
  handle: string
  joinedAt: string
  level: number
  levelTitle: string
  nextLevelTitle: string
  levelCurrent: number
  levelTarget: number
  championPick: string
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
  got: boolean
  tone: ProfileAchievementTone
}

export interface ProfileHistoryEntry {
  match: string
  mine: string
  pts: number
  kind: ProfileHistoryKind
}
