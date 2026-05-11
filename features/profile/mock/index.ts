import { LEADERBOARD } from "@/features/rankings/mock"
import type {
  ProfileAchievement,
  ProfileHeroStat,
  ProfileHistoryEntry,
  ProfileUser,
} from "@/features/profile/types"

const rankingYou = LEADERBOARD.find((entry) => entry.isYou)

export const PROFILE_USER: ProfileUser = {
  name: "Alex Mendes",
  handle: "@you",
  joinedAt: "Joined Jun 1",
  level: 12,
  levelTitle: "Pundit",
  nextLevelTitle: "Tactician",
  levelCurrent: 247,
  levelTarget: 300,
  championPick: "ARG",
  points: rankingYou?.pts ?? 0,
  rank: rankingYou?.rank ?? 1,
  rankOf: 12,
  accuracy: rankingYou?.acc ?? 0,
  streak: rankingYou?.streak ?? 0,
}

export const PROFILE_HERO_STATS: ProfileHeroStat[] = [
  { label: "Points", value: String(PROFILE_USER.points), delta: "+47" },
  { label: "Rank", value: `#${PROFILE_USER.rank}`, sub: `of ${PROFILE_USER.rankOf}` },
  { label: "Accuracy", value: `${PROFILE_USER.accuracy}%`, delta: "+4" },
  { label: "Streak", value: String(PROFILE_USER.streak), fire: true },
]

export const PROFILE_FORM_LAST7 = [5, 2, 0, 5, 2, 5, 5]

export const PROFILE_ACHIEVEMENTS: ProfileAchievement[] = [
  { id: "ac1", name: "Perfect Score", sub: "5× exact predictions", got: true, tone: "lime" },
  { id: "ac2", name: "Hot Streak", sub: "4 in a row", got: true, tone: "amber" },
  { id: "ac3", name: "Underdog", sub: "Called 3 upsets", got: true, tone: "violet" },
  { id: "ac4", name: "Group Stage", sub: "Predict every Group A", got: true, tone: "lime" },
  { id: "ac5", name: "Knockout King", sub: "All R16 winners", got: false, tone: "mute" },
  { id: "ac6", name: "Final Caller", sub: "Predict the final", got: false, tone: "mute" },
]

export const PROFILE_HISTORY: ProfileHistoryEntry[] = [
  { match: "JPN 1–2 KOR", mine: "1–2", pts: 5, kind: "exact" },
  { match: "GER 2–0 SUI", mine: "2–1", pts: 2, kind: "result" },
  { match: "POR 1–1 URU", mine: "2–1", pts: 0, kind: "miss" },
  { match: "BEL 0–2 MAR", mine: "1–2", pts: 2, kind: "result" },
  { match: "COL 3–1 SEN", mine: "3–1", pts: 5, kind: "exact" },
]
