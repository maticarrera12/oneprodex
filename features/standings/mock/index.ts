import type { StandingGroup } from "@/features/standings/types"

export const STANDINGS_GROUPS: StandingGroup[] = [
  {
    id: "A",
    name: "Grupo A",
    matchdayLabel: "Matchday 2",
    played: 6,
    total: 12,
    rows: [
      { team: "ARG", pj: 3, g: 2, e: 1, p: 0, gd: 4, pts: 7, form: ["W", "D", "W"], qualification: "qual" },
      { team: "ESP", pj: 3, g: 2, e: 0, p: 1, gd: 2, pts: 6, form: ["W", "L", "W"], qualification: "qual" },
      { team: "MEX", pj: 3, g: 1, e: 1, p: 1, gd: -1, pts: 4, form: ["D", "L", "W"], qualification: "playoff" },
      { team: "POR", pj: 3, g: 0, e: 0, p: 3, gd: -5, pts: 0, form: ["L", "L", "L"], qualification: "out" },
    ],
    fixtures: [
      { id: "a-fx-1", home: "ARG", away: "ESP", hs: 2, as: 1, logoHome: null, logoAway: null, status: "FT", minute: null, when: "Ayer · 21:00" },
      { id: "a-fx-2", home: "MEX", away: "POR", hs: 1, as: 1, logoHome: null, logoAway: null, status: "FT", minute: null, when: "Ayer · 18:00" },
      { id: "a-fx-3", home: "ARG", away: "MEX", hs: 2, as: 1, logoHome: null, logoAway: null, status: "LIVE", minute: 73, when: "Hoy · 21:00" },
      { id: "a-fx-4", home: "ESP", away: "POR", hs: null, as: null, logoHome: null, logoAway: null, status: "UPCOMING", minute: null, when: "Mañana · 21:00" },
    ],
    insight: {
      title: "3 de 4 predicciones correctas",
      subtitle: "Acertaste ARG sobre ESP. +12 pts",
      pct: 75,
    },
  },
  {
    id: "B",
    name: "Grupo B",
    matchdayLabel: "Matchday 2",
    played: 6,
    total: 12,
    rows: [
      { team: "FRA", pj: 3, g: 2, e: 1, p: 0, gd: 3, pts: 7, form: ["W", "D", "W"], qualification: "qual" },
      { team: "BRA", pj: 3, g: 1, e: 2, p: 0, gd: 2, pts: 5, form: ["D", "D", "W"], qualification: "qual" },
      { team: "GER", pj: 3, g: 1, e: 0, p: 2, gd: -1, pts: 3, form: ["L", "W", "L"], qualification: "playoff" },
      { team: "NED", pj: 3, g: 0, e: 1, p: 2, gd: -4, pts: 1, form: ["L", "D", "L"], qualification: "out" },
    ],
    fixtures: [
      { id: "b-fx-1", home: "FRA", away: "BRA", hs: 0, as: 0, logoHome: null, logoAway: null, status: "FT", minute: null, when: "Ayer · 18:00" },
      { id: "b-fx-2", home: "GER", away: "NED", hs: 3, as: 1, logoHome: null, logoAway: null, status: "FT", minute: null, when: "Anteayer · 16:00" },
      { id: "b-fx-3", home: "BRA", away: "GER", hs: 1, as: 1, logoHome: null, logoAway: null, status: "LIVE", minute: 42, when: "Hoy · 18:00" },
      { id: "b-fx-4", home: "FRA", away: "NED", hs: null, as: null, logoHome: null, logoAway: null, status: "UPCOMING", minute: null, when: "Mañana · 20:00" },
    ],
    insight: {
      title: "2 de 4 predicciones correctas",
      subtitle: "Te falta clavar BRA vs GER.",
      pct: 50,
    },
  },
]
