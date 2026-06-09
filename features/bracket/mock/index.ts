import type { BracketRound, BracketScoreStat } from "@/features/bracket/types"

const ROUND_16 = [
  { id: "r16-1", a: "ARG", b: "AUS", sa: 2, sb: 1, done: true, kickoff: null, pen: false, sap: null, sbp: null, logoA: null, logoB: null },
  { id: "r16-2", a: "NED", b: "USA", sa: 3, sb: 1, done: true, kickoff: null, pen: false, sap: null, sbp: null, logoA: null, logoB: null },
  { id: "r16-3", a: "JPN", b: "CRO", sa: 1, sb: 1, done: true, kickoff: null, pen: true, sap: 4, sbp: 5, logoA: null, logoB: null },
  { id: "r16-4", a: "BRA", b: "KOR", sa: 4, sb: 1, done: true, kickoff: null, pen: false, sap: null, sbp: null, logoA: null, logoB: null },
  { id: "r16-5", a: "ENG", b: "SEN", sa: 3, sb: 0, done: true, kickoff: null, pen: false, sap: null, sbp: null, logoA: null, logoB: null },
  { id: "r16-6", a: "FRA", b: "POL", sa: 3, sb: 1, done: true, kickoff: null, pen: false, sap: null, sbp: null, logoA: null, logoB: null },
  { id: "r16-7", a: "MAR", b: "ESP", sa: null, sb: null, done: false, kickoff: "Dom 18:00", pen: false, sap: null, sbp: null, logoA: null, logoB: null },
  { id: "r16-8", a: "POR", b: "SUI", sa: null, sb: null, done: false, kickoff: "Dom 21:00", pen: false, sap: null, sbp: null, logoA: null, logoB: null },
]

const QUARTERS = [
  { id: "qf-1", a: "ARG", b: "NED", sa: null, sb: null, done: false, kickoff: "Vie", pen: false, sap: null, sbp: null, logoA: null, logoB: null },
  { id: "qf-2", a: "CRO", b: "BRA", sa: null, sb: null, done: false, kickoff: "Vie", pen: false, sap: null, sbp: null, logoA: null, logoB: null },
  { id: "qf-3", a: "ENG", b: "FRA", sa: null, sb: null, done: false, kickoff: "Sáb", pen: false, sap: null, sbp: null, logoA: null, logoB: null },
  { id: "qf-4", a: "???", b: "???", sa: null, sb: null, done: false, kickoff: "Sáb", pen: false, sap: null, sbp: null, logoA: null, logoB: null },
]

const SEMIS = [
  { id: "sf-1", a: "???", b: "???", sa: null, sb: null, done: false, kickoff: "Mar", pen: false, sap: null, sbp: null, logoA: null, logoB: null },
  { id: "sf-2", a: "???", b: "???", sa: null, sb: null, done: false, kickoff: "Mié", pen: false, sap: null, sbp: null, logoA: null, logoB: null },
]

const FINAL = [
  { id: "fin", a: "???", b: "???", sa: null, sb: null, done: false, kickoff: "19 Jul", pen: false, sap: null, sbp: null, logoA: null, logoB: null },
]

export const BRACKET_ROUNDS: BracketRound[] = [
  { id: "r16", title: "Octavos", matches: ROUND_16, wide: true },
  { id: "qf", title: "Cuartos", matches: QUARTERS },
  { id: "sf", title: "Semifinal", matches: SEMIS, short: true },
  { id: "final", title: "Final", matches: FINAL, short: true, final: true, wide: true },
]

export const BRACKET_SCORE: BracketScoreStat[] = [
  { label: "R16", got: "5/8", pts: "+25", hot: true },
  { label: "QF", got: "2/2", pts: "+20", hot: true },
  { label: "SF", got: "1/0", pts: "—" },
  { label: "Final", got: "0/0", pts: "—" },
]

export const CHAMPION_PICK = {
  code: "ARG",
  name: "Argentina",
  subtitle: "Vale +50 pts si levanta la copa",
}
