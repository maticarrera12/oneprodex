import type { SupabaseClient } from "@supabase/supabase-js"
import type { GroupCode, GroupRankings } from "@/features/onboarding/types"
import { resolveR32Pairs } from "@/features/onboarding/utils/slot-resolver"
import type { BracketRound, BracketScoreStat } from "@/features/bracket/types"
import { matchWinner } from "@/features/scoring/bracket"
import type { KnockoutMatch } from "@/features/scoring/bracket"
import { BRACKET_SCORING } from "@/features/scoring/constants"
import type { Database } from "@/lib/supabase/database.types"
import { applyWorldCupSeasonKickoffFilter } from "@/lib/world-cup/season"

type BracketData = {
  rounds: BracketRound[]
  actualRounds: BracketRound[]
  scoreStats: BracketScoreStat[]
  champion: {
    code: string
    name: string
    logo: string | null
    subtitle: string
  }
  readOnly: boolean
}

type TeamRow = Pick<Database["public"]["Tables"]["teams"]["Row"], "code" | "name" | "logo">
type GroupPickRow = Pick<Database["public"]["Tables"]["group_picks"]["Row"], "group_code" | "position" | "team_code">
type BracketPickRow = Pick<Database["public"]["Tables"]["bracket_picks"]["Row"], "slot" | "team_code" | "home_score" | "away_score">
type ScoreBySlot = Map<string, { home: number | null; away: number | null }>
type KnockoutMatchRow = Pick<Database["public"]["Tables"]["matches"]["Row"], "id" | "home_team_code" | "away_team_code" | "home_score" | "away_score" | "home_pen_score" | "away_pen_score" | "status" | "kickoff" | "stage">

const KNOCKOUT_STAGES: Array<{ stage: string } & Omit<BracketRound, "matches">> = [
  { stage: "Round of 32",    id: "r32",   title: "Ronda de 32",    wide: true },
  { stage: "Round of 16",    id: "r16",   title: "Octavos",        wide: true },
  { stage: "Quarter-finals", id: "qf",    title: "Cuartos" },
  { stage: "Semi-finals",    id: "sf",    title: "Semifinal",      short: true },
  { stage: "3rd Place Final",id: "third", title: "Tercer puesto",  short: true },
  { stage: "Final",          id: "final", title: "Final",          short: true, final: true, wide: true },
]

function buildActualRounds(knockoutMatches: KnockoutMatchRow[], logoByCode: Map<string, string | null>): BracketRound[] {
  const byStage = new Map<string, KnockoutMatchRow[]>()
  for (const m of knockoutMatches) {
    const list = byStage.get(m.stage) ?? []
    list.push(m)
    byStage.set(m.stage, list)
  }

  return KNOCKOUT_STAGES.flatMap(({ stage, ...roundMeta }) => {
    const stageMatches = byStage.get(stage)
    if (!stageMatches?.length) return []
    return [{
      ...roundMeta,
      matches: stageMatches.map((m, i) => ({
        id: `actual-${roundMeta.id}-${i}`,
        a: m.home_team_code,
        b: m.away_team_code,
        logoA: logoByCode.get(m.home_team_code) ?? null,
        logoB: logoByCode.get(m.away_team_code) ?? null,
        sa: m.home_score,
        sb: m.away_score,
        done: m.status === "FINISHED",
        kickoff: m.kickoff,
        pen: m.home_pen_score !== null || m.away_pen_score !== null,
        sap: m.home_pen_score,
        sbp: m.away_pen_score,
      })),
    }]
  })
}

const GROUP_CODES: GroupCode[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]

function emptyRankings(): GroupRankings {
  return {
    A: ["", "", "", ""],
    B: ["", "", "", ""],
    C: ["", "", "", ""],
    D: ["", "", "", ""],
    E: ["", "", "", ""],
    F: ["", "", "", ""],
    G: ["", "", "", ""],
    H: ["", "", "", ""],
    I: ["", "", "", ""],
    J: ["", "", "", ""],
    K: ["", "", "", ""],
    L: ["", "", "", ""],
  }
}

function buildRankings(rows: GroupPickRow[]): GroupRankings | null {
  if (rows.length === 0) return null
  const rankings = emptyRankings()
  for (const row of rows) {
    const group = row.group_code as GroupCode
    const idx = row.position - 1
    if (!GROUP_CODES.includes(group) || idx < 0 || idx > 3) continue
    rankings[group][idx] = row.team_code
  }
  return rankings
}

function getStarterTeams(rankings: GroupRankings | null, bestThirds: string[]): string[] {
  if (!rankings) return Array.from({ length: 32 }, (_, idx) => `T${idx + 1}`)
  return resolveR32Pairs(rankings, bestThirds).flatMap(({ home, away }) => [home, away])
}

function buildRounds(
  picksBySlot: Map<string, string>,
  starters: string[],
  logoByCode: Map<string, string | null>,
  scoresBySlot: ScoreBySlot,
): BracketRound[] {
  const match = (id: string, slot: string, a: string, b: string) => ({
    id,
    a,
    b,
    logoA: logoByCode.get(a) ?? null,
    logoB: logoByCode.get(b) ?? null,
    sa: scoresBySlot.get(slot)?.home ?? null,
    sb: scoresBySlot.get(slot)?.away ?? null,
    done: false,
    kickoff: null,
    pen: false,
    sap: null,
    sbp: null,
  })

  const r32 = Array.from({ length: 16 }, (_, index) =>
    match(`r32-${index + 1}`, `R32_P${index + 1}`, starters[index * 2] ?? "???", starters[index * 2 + 1] ?? "???")
  )

  const r16 = Array.from({ length: 8 }, (_, index) =>
    match(
      `r16-${index + 1}`,
      `R16_P${index + 1}`,
      picksBySlot.get(`R32_P${index * 2 + 1}`) ?? "???",
      picksBySlot.get(`R32_P${index * 2 + 2}`) ?? "???"
    )
  )

  const qf = Array.from({ length: 4 }, (_, index) =>
    match(
      `qf-${index + 1}`,
      `QF_P${index + 1}`,
      picksBySlot.get(`R16_P${index * 2 + 1}`) ?? "???",
      picksBySlot.get(`R16_P${index * 2 + 2}`) ?? "???"
    )
  )

  const sf = Array.from({ length: 2 }, (_, index) =>
    match(
      `sf-${index + 1}`,
      `SF_P${index + 1}`,
      picksBySlot.get(`QF_P${index * 2 + 1}`) ?? "???",
      picksBySlot.get(`QF_P${index * 2 + 2}`) ?? "???"
    )
  )

  const sf1Winner = picksBySlot.get("SF_P1")
  const sf2Winner = picksBySlot.get("SF_P2")
  const sf1Left = picksBySlot.get("QF_P1") ?? "???"
  const sf1Right = picksBySlot.get("QF_P2") ?? "???"
  const sf2Left = picksBySlot.get("QF_P3") ?? "???"
  const sf2Right = picksBySlot.get("QF_P4") ?? "???"
  const sf1Loser = sf1Winner ? (sf1Winner === sf1Left ? sf1Right : sf1Left) : "???"
  const sf2Loser = sf2Winner ? (sf2Winner === sf2Left ? sf2Right : sf2Left) : "???"

  const third = [match("third-1", "THIRD", sf1Loser, sf2Loser)]
  const final = [match("final-1", "FINAL", sf1Winner ?? "???", sf2Winner ?? "???")]

  return [
    { id: "r32", title: "Ronda de 32", matches: r32, wide: true },
    { id: "r16", title: "Octavos", matches: r16, wide: true },
    { id: "qf", title: "Cuartos", matches: qf },
    { id: "sf", title: "Semifinal", matches: sf, short: true },
    { id: "third", title: "Tercer puesto", matches: third, short: true },
    { id: "final", title: "Final", matches: final, short: true, final: true, wide: true },
  ]
}

const STAGE_TO_SLOT_PREFIX: Record<string, { prefix: string; total: number; pts: number }> = {
  "Round of 32":    { prefix: "R32_", total: 16, pts: BRACKET_SCORING.R32 },
  "Round of 16":    { prefix: "R16_", total: 8,  pts: BRACKET_SCORING.R16 },
  "Quarter-finals": { prefix: "QF_",  total: 4,  pts: BRACKET_SCORING.QF },
  "Semi-finals":    { prefix: "SF_",  total: 2,  pts: BRACKET_SCORING.SF },
}

function buildScoreStats(
  picksBySlot: Map<string, string>,
  winnersByStage: Map<string, Set<string>>,
): BracketScoreStat[] {
  const stats: BracketScoreStat[] = Object.entries(STAGE_TO_SLOT_PREFIX).map(([stage, { prefix, total, pts }]) => {
    const winners = winnersByStage.get(stage) ?? new Set<string>()
    const picks = [...picksBySlot.entries()].filter(([slot]) => slot.startsWith(prefix)).map(([, team]) => team)
    const correct = picks.filter((team) => winners.has(team)).length
    const played = winners.size
    return {
      label: prefix.replace("_", ""),
      got: `${correct}/${played > 0 ? played : total}`,
      pts: correct > 0 ? `+${correct * pts}` : "—",
      hot: correct > 0 && correct === played,
    }
  })

  const finalWinners = winnersByStage.get("Final") ?? new Set<string>()
  const finalPick = picksBySlot.get("FINAL")
  const finalCorrect = finalPick && finalWinners.has(finalPick)
  stats.push({
    label: "Final",
    got: finalWinners.size > 0 ? (finalCorrect ? "1/1" : "0/1") : (finalPick ? "1/1" : "0/1"),
    pts: finalCorrect ? `+${BRACKET_SCORING.FINAL}` : finalWinners.size > 0 ? "—" : finalPick ? "pendiente" : "—",
    hot: Boolean(finalCorrect),
  })

  return stats
}

export async function getBracketData(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<BracketData | null> {
  const [teamsResult, userResult, groupRowsResult, thirdRowsResult, picksResult, knockoutResult, allKnockoutResult] = await Promise.all([
    supabase.from("teams").select("code,name,logo"),
    supabase.from("users").select("awards_at").eq("id", userId).maybeSingle(),
    supabase
      .from("group_picks")
      .select("group_code,position,team_code")
      .eq("user_id", userId)
      .order("group_code", { ascending: true })
      .order("position", { ascending: true }),
    supabase
      .from("group_picks")
      .select("team_code")
      .eq("user_id", userId)
      .eq("position", 3)
      .eq("advances_as_third", true)
      .order("group_code", { ascending: true }),
    supabase.from("bracket_picks").select("slot,team_code,home_score,away_score").eq("user_id", userId).order("slot", { ascending: true }),
    applyWorldCupSeasonKickoffFilter(
      supabase
        .from("matches")
        .select("id,home_team_code,away_team_code,home_score,away_score,home_pen_score,away_pen_score,status,kickoff,stage")
        .eq("status", "FINISHED")
        .in("stage", Object.keys(STAGE_TO_SLOT_PREFIX).concat(["Final"])),
    ),
    applyWorldCupSeasonKickoffFilter(
      supabase
        .from("matches")
        .select("id,home_team_code,away_team_code,home_score,away_score,home_pen_score,away_pen_score,status,kickoff,stage")
        .in("stage", KNOCKOUT_STAGES.map((s) => s.stage)),
    ).order("kickoff", { ascending: true }),
  ])

  if (picksResult.error) {
    // Distinguish a transient read failure from a genuinely empty bracket: both return
    // null (callers render the "no bracket yet" state), but only the error is unexpected.
    console.error("getBracketData: failed to read bracket_picks", picksResult.error)
    return null
  }
  if (picksResult.data.length === 0) return null

  const winnersByStage = new Map<string, Set<string>>()
  for (const match of knockoutResult.data ?? []) {
    const winner = matchWinner(match as KnockoutMatch)
    if (!winner) continue
    const set = winnersByStage.get(match.stage) ?? new Set<string>()
    set.add(winner)
    winnersByStage.set(match.stage, set)
  }

  const teamsByCode = new Map((teamsResult.data ?? []).map((team: TeamRow) => [team.code, team.name] as const))
  const logoByCode = new Map((teamsResult.data ?? []).map((team: TeamRow) => [team.code, team.logo ?? null] as const))
  const picksBySlot = new Map((picksResult.data ?? []).map((pick: BracketPickRow) => [pick.slot, pick.team_code] as const))
  const scoresBySlot: ScoreBySlot = new Map(
    (picksResult.data ?? []).map((pick: BracketPickRow) => [pick.slot, { home: pick.home_score, away: pick.away_score }] as const),
  )
  const rankings = groupRowsResult.error ? null : buildRankings(groupRowsResult.data ?? [])
  const bestThirds = thirdRowsResult.error ? [] : (thirdRowsResult.data ?? []).map((row) => row.team_code)
  const starterTeams = getStarterTeams(rankings, bestThirds)
  const championCode = picksBySlot.get("FINAL") ?? "???"

  return {
    rounds: buildRounds(picksBySlot, starterTeams, logoByCode, scoresBySlot),
    actualRounds: buildActualRounds((allKnockoutResult.data ?? []) as KnockoutMatchRow[], logoByCode),
    scoreStats: buildScoreStats(picksBySlot, winnersByStage),
    champion: {
      code: championCode,
      name: teamsByCode.get(championCode) ?? championCode,
      logo: logoByCode.get(championCode) ?? null,
      subtitle: "Predicción de campeón",
    },
    readOnly: Boolean(userResult.data?.awards_at),
  }
}
