import type {
  ProfileHeroStat,
  ProfileHistoryEntry,
  ProfileUser,
} from "@/features/profile/types"

export const PROFILE_USER: ProfileUser = {
  name: "Matias Carrera",
  handle: "mcarreradev12",
  joinedAt: "10/05/2026",
  level: 1,
  levelTitle: "Pundit",
  nextLevelTitle: "Tactician",
  levelCurrent: 0,
  levelTarget: 100,
  championPick: "ARG",
  points: 245,
  rank: 1,
  rankOf: 1,
  accuracy: 74,
  streak: 5,
}

export const PROFILE_HERO_STATS: ProfileHeroStat[] = [
  { label: "Total puntos", value: "245" },
  { label: "de 1", value: "#1", sub: "de 1" },
  { label: "Precisión general", value: "74%" },
  { label: "Aciertos seguidos", value: "5", fire: true },
]

export const PROFILE_FORM_LAST7 = [5, 5, 5, 5, 2, 0, 0]


export const PROFILE_HISTORY: ProfileHistoryEntry[] = [
  {
    date: "12/06",
    homeTeam: "Argentina",
    homeFlag: "ARG",
    awayTeam: "Marruecos",
    awayFlag: "MAR",
    myPrediction: "2 - 0",
    result: "2 - 0",
    pts: 3,
    kind: "exact",
    phase: "grupos",
  },
  {
    date: "13/06",
    homeTeam: "España",
    homeFlag: "ESP",
    awayTeam: "Croacia",
    awayFlag: "CRO",
    myPrediction: "1 - 1",
    result: "3 - 1",
    pts: 1,
    kind: "result",
    phase: "grupos",
  },
  {
    date: "14/06",
    homeTeam: "Brasil",
    homeFlag: "BRA",
    awayTeam: "Senegal",
    awayFlag: "SEN",
    myPrediction: "2 - 1",
    result: "1 - 1",
    pts: 0,
    kind: "miss",
    phase: "grupos",
  },
]
