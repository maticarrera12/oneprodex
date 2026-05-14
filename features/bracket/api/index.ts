import type { SupabaseClient } from "@supabase/supabase-js"
import type { GroupCode, GroupRankings } from "@/features/onboarding/types"
import { resolveSlots } from "@/features/onboarding/utils/slot-resolver"
import type { BracketRound, BracketScoreStat } from "@/features/bracket/types"
import type { Database } from "@/lib/supabase/database.types"

type BracketData = {
  rounds: BracketRound[]
  scoreStats: BracketScoreStat[]
  champion: {
    code: string
    name: string
    subtitle: string
  }
  readOnly: boolean
}

type TeamRow = Pick<Database["public"]["Tables"]["teams"]["Row"], "code" | "name">
type GroupPickRow = Pick<Database["public"]["Tables"]["group_picks"]["Row"], "group_code" | "position" | "team_code">
type BracketPickRow = Pick<Database["public"]["Tables"]["bracket_picks"]["Row"], "slot" | "team_code">

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
  const resolved = resolveSlots(rankings, bestThirds)
  const list = Object.values(resolved).filter(Boolean)
  if (list.length >= 32) return list.slice(0, 32)
  while (list.length < 32) list.push(`T${list.length + 1}`)
  return list
}

function buildRounds(picksBySlot: Map<string, string>, starters: string[]): BracketRound[] {
  const match = (id: string, a: string, b: string) => ({
    id,
    a,
    b,
    sa: null,
    sb: null,
    done: false,
    kickoff: null,
    pen: false,
    sap: null,
    sbp: null,
  })

  const r32 = Array.from({ length: 16 }, (_, index) =>
    match(`r32-${index + 1}`, starters[index * 2] ?? "???", starters[index * 2 + 1] ?? "???")
  )

  const r16 = Array.from({ length: 8 }, (_, index) =>
    match(
      `r16-${index + 1}`,
      picksBySlot.get(`R32_P${index * 2 + 1}`) ?? "???",
      picksBySlot.get(`R32_P${index * 2 + 2}`) ?? "???"
    )
  )

  const qf = Array.from({ length: 4 }, (_, index) =>
    match(
      `qf-${index + 1}`,
      picksBySlot.get(`R16_P${index * 2 + 1}`) ?? "???",
      picksBySlot.get(`R16_P${index * 2 + 2}`) ?? "???"
    )
  )

  const sf = Array.from({ length: 2 }, (_, index) =>
    match(
      `sf-${index + 1}`,
      picksBySlot.get(`QF_P${index * 2 + 1}`) ?? "???",
      picksBySlot.get(`QF_P${index * 2 + 2}`) ?? "???"
    )
  )

  const third = [match("third-1", picksBySlot.get("SF_P1") ?? "???", picksBySlot.get("SF_P2") ?? "???")]
  const final = [match("final-1", picksBySlot.get("SF_P1") ?? "???", picksBySlot.get("SF_P2") ?? "???")]

  return [
    { id: "r32", title: "Ronda de 32", matches: r32, wide: true },
    { id: "r16", title: "Octavos", matches: r16, wide: true },
    { id: "qf", title: "Cuartos", matches: qf },
    { id: "sf", title: "Semifinal", matches: sf, short: true },
    { id: "third", title: "Tercer puesto", matches: third, short: true },
    { id: "final", title: "Final", matches: final, short: true, final: true, wide: true },
  ]
}

function buildScoreStats(picksBySlot: Map<string, string>): BracketScoreStat[] {
  const byPrefix = (prefix: string, total: number) => {
    const selected = [...picksBySlot.keys()].filter((slot) => slot.startsWith(prefix)).length
    return { label: prefix, got: `${selected}/${total}`, pts: `+${selected * 2}` }
  }

  return [
    byPrefix("R32_", 16),
    byPrefix("R16_", 8),
    byPrefix("QF_", 4),
    byPrefix("SF_", 2),
    { label: "Final", got: picksBySlot.has("FINAL") ? "1/1" : "0/1", pts: picksBySlot.has("FINAL") ? "+8" : "—" },
  ]
}

export async function getBracketData(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<BracketData | null> {
  const [teamsResult, userResult, groupRowsResult, thirdRowsResult, picksResult] = await Promise.all([
    supabase.from("teams").select("code,name"),
    supabase.from("users").select("bracket_submitted_at").eq("id", userId).maybeSingle(),
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
    supabase.from("bracket_picks").select("slot,team_code").eq("user_id", userId).order("slot", { ascending: true }),
  ])

  if (picksResult.error) return null

  const teamsByCode = new Map((teamsResult.data ?? []).map((team: TeamRow) => [team.code, team.name] as const))
  const picksBySlot = new Map((picksResult.data ?? []).map((pick: BracketPickRow) => [pick.slot, pick.team_code] as const))
  const rankings = groupRowsResult.error ? null : buildRankings(groupRowsResult.data ?? [])
  const bestThirds = thirdRowsResult.error ? [] : (thirdRowsResult.data ?? []).map((row) => row.team_code)
  const starterTeams = getStarterTeams(rankings, bestThirds)
  const championCode = picksBySlot.get("FINAL") ?? "???"

  return {
    rounds: buildRounds(picksBySlot, starterTeams),
    scoreStats: buildScoreStats(picksBySlot),
    champion: {
      code: championCode,
      name: teamsByCode.get(championCode) ?? championCode,
      subtitle: "Predicción de campeón",
    },
    readOnly: Boolean(userResult.data?.bracket_submitted_at),
  }
}
