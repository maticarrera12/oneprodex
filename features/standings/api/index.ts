import type { SupabaseClient } from "@supabase/supabase-js"
import { formatKickoffParts } from "@/features/matches/utils/kickoff"
import type { GroupFixture, StandingGroup, StandingQualification, StandingRow } from "@/features/standings/types"
import {
  sortTeamsByOlympicTiebreak,
  type GroupMatchResult,
} from "@/features/standings/utils/group-tiebreak"
import { computeProjectedStandingRowsByGroup, buildGroupTeamAliasMap, resolveRosterTeamCode } from "@/features/standings/utils/projected-standings"
import type { Database } from "@/lib/supabase/database.types"

type MatchRow = Pick<
  Database["public"]["Tables"]["matches"]["Row"],
  "id" | "home_team_code" | "away_team_code" | "home_score" | "away_score" | "status" | "kickoff" | "minute" | "stage" | "group_code"
>
type TeamVisualRow = Pick<
  Database["public"]["Tables"]["teams"]["Row"],
  "api_id" | "code" | "logo" | "name" | "c1" | "c2" | "c3"
>
type PredictionRow = Pick<
  Database["public"]["Tables"]["predictions"]["Row"],
  "match_id" | "home_score" | "away_score"
>
type TeamAccum = { w: number; d: number; l: number; gf: number; ga: number; pts: number }

function normalizeTeamCode(code: string): string {
  return code.trim().toUpperCase()
}

function normalizeLogoUrl(logo: string | null): string | null {
  if (!logo) return null
  const trimmed = logo.trim()
  if (trimmed.startsWith("https://")) return trimmed
  if (trimmed.startsWith("http://")) return `https://${trimmed.slice("http://".length)}`
  if (trimmed.startsWith("//")) return `https:${trimmed}`
  return trimmed
}

function normalizeGroupCode(code: string): string {
  const raw = code.trim().toUpperCase()
  return raw.startsWith("GROUP ") ? raw.slice(6) : raw
}

function resolveMatchGroupCode(
  match: Pick<MatchRow, "group_code" | "home_team_code" | "away_team_code">,
  teamToGroup: Map<string, string>,
): string | null {
  if (match.group_code) return normalizeGroupCode(match.group_code)
  const home = normalizeTeamCode(match.home_team_code)
  const away = normalizeTeamCode(match.away_team_code)
  return teamToGroup.get(home) ?? teamToGroup.get(away) ?? null
}

function resolveQualification(position: number): StandingQualification {
  if (position < 2) return "qual"
  if (position === 2) return "playoff"
  return "out"
}

function resolveTeam(
  code: string,
  teamsByCode: Map<string, TeamVisualRow>,
  teamsByApiId: Map<string, TeamVisualRow>,
): TeamVisualRow | undefined {
  return teamsByCode.get(normalizeTeamCode(code)) ?? teamsByApiId.get(code.trim())
}

function mapAccumToStandingRow(
  teamCode: string,
  accum: TeamAccum,
  position: number,
  teamsByCode: Map<string, TeamVisualRow>,
  teamsByApiId: Map<string, TeamVisualRow>,
): StandingRow {
  const team = resolveTeam(teamCode, teamsByCode, teamsByApiId)
  return {
    team: team?.code ?? normalizeTeamCode(teamCode),
    teamName: team?.name ?? null,
    logo: normalizeLogoUrl(team?.logo ?? null),
    c1: team?.c1 ?? null,
    c2: team?.c2 ?? null,
    c3: team?.c3 ?? null,
    pj: accum.w + accum.d + accum.l,
    g: accum.w,
    e: accum.d,
    p: accum.l,
    gd: accum.gf - accum.ga,
    pts: accum.pts,
    form: [],
    qualification: resolveQualification(position),
  }
}

function mapMatchToGroupFixture(row: MatchRow, logoByCode: Map<string, string | null>): GroupFixture {
  const { date, time } = formatKickoffParts(row.kickoff)
  const home = normalizeTeamCode(row.home_team_code)
  const away = normalizeTeamCode(row.away_team_code)
  const rawStatus = row.status as string
  const status: GroupFixture["status"] =
    rawStatus === "FINISHED" ? "FT" : rawStatus === "LIVE" ? "LIVE" : "UPCOMING"

  return {
    id: row.id,
    home,
    away,
    logoHome: logoByCode.get(home) ?? null,
    logoAway: logoByCode.get(away) ?? null,
    hs: row.home_score,
    as: row.away_score,
    status,
    minute: row.minute,
    when: `${date} · ${time}`,
  }
}

export async function getStandingsByGroup(
  supabase: SupabaseClient<Database>,
  userId?: string | null,
): Promise<StandingGroup[]> {
  const [{ data: standingsData, error: standingsError }, { data: matchData }, { data: teamsData }, { data: predictionData }] =
    await Promise.all([
      supabase
        .from("standings")
        .select("group_code, team_code")
        .order("group_code", { ascending: true }),
      supabase
        .from("matches")
        .select("id,home_team_code,away_team_code,home_score,away_score,status,kickoff,minute,stage,group_code")
        .ilike("stage", "Group Stage%"),
      supabase.from("teams").select("api_id,code,logo,name,c1,c2,c3"),
      userId
        ? supabase
          .from("predictions")
          .select("match_id,home_score,away_score")
          .eq("user_id", userId)
        : Promise.resolve({ data: [] as PredictionRow[] }),
    ])

  if (standingsError || !standingsData || standingsData.length === 0) return []

  const teamsByCode = new Map((teamsData ?? []).map((t) => [normalizeTeamCode(t.code), t] as const))
  const teamsByApiId = new Map(
    (teamsData ?? [])
      .filter((t): t is TeamVisualRow & { api_id: number } => typeof t.api_id === "number")
      .map((t) => [String(t.api_id), t] as const),
  )
  const logoByCode = new Map<string, string | null>(
    (teamsData ?? []).map((t) => [normalizeTeamCode(t.code), t.logo ?? null]),
  )

  // Build group → canonical team codes map from standings table
  // standings.team_code may be a numeric API ID — resolve to canonical code
  const groupToTeams = new Map<string, string[]>()
  const teamToGroup = new Map<string, string>()

  for (const row of standingsData) {
    const groupCode = normalizeGroupCode(row.group_code)
    const resolved = resolveTeam(row.team_code, teamsByCode, teamsByApiId)
    const canonicalCode = resolved?.code ?? normalizeTeamCode(row.team_code)

    const existing = groupToTeams.get(groupCode) ?? []
    existing.push(canonicalCode)
    groupToTeams.set(groupCode, existing)
    teamToGroup.set(canonicalCode, groupCode)
    // also map the raw team_code in case it's a numeric id
    teamToGroup.set(normalizeTeamCode(row.team_code), groupCode)
  }

  const teamApiIdByCode = new Map(
    (teamsData ?? []).map((team) => [normalizeTeamCode(team.code), team.api_id] as const),
  )
  const teamAliasesByGroup = buildGroupTeamAliasMap(groupToTeams, teamApiIdByCode)
  for (const row of standingsData) {
    const groupCode = normalizeGroupCode(row.group_code)
    const resolved = resolveTeam(row.team_code, teamsByCode, teamsByApiId)
    const canonicalCode = normalizeTeamCode(resolved?.code ?? row.team_code)
    const aliases = teamAliasesByGroup.get(groupCode)
    if (!aliases) continue
    aliases.set(normalizeTeamCode(row.team_code), canonicalCode)
    aliases.set(row.team_code.trim(), canonicalCode)
  }

  // Compute live stats from matches (FINISHED + LIVE), seed all teams at 0
  const accumByGroup = new Map<string, Map<string, TeamAccum>>()
  const fixturesByGroup = new Map<string, MatchRow[]>()
  const resultsByGroup = new Map<string, GroupMatchResult[]>()

  for (const [groupCode, teams] of groupToTeams) {
    const accumMap = new Map<string, TeamAccum>()
    for (const code of teams) {
      accumMap.set(code, { w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 })
    }
    accumByGroup.set(groupCode, accumMap)
    resultsByGroup.set(groupCode, [])
  }

  for (const match of matchData ?? []) {
    const groupCode = resolveMatchGroupCode(match, teamToGroup)
    if (!groupCode) continue

    const home = resolveRosterTeamCode(groupCode, match.home_team_code, groupToTeams, teamAliasesByGroup)
    const away = resolveRosterTeamCode(groupCode, match.away_team_code, groupToTeams, teamAliasesByGroup)
    if (!home || !away) continue

    const existing = fixturesByGroup.get(groupCode) ?? []
    existing.push(match as MatchRow)
    fixturesByGroup.set(groupCode, existing)

    if (match.status !== "FINISHED" && match.status !== "LIVE") continue
    const accumMap = accumByGroup.get(groupCode)
    if (!accumMap) continue

    const hs = match.home_score ?? 0
    const as_ = match.away_score ?? 0
    const homeAccum = accumMap.get(home)
    const awayAccum = accumMap.get(away)
    if (!homeAccum || !awayAccum) continue

    homeAccum.gf += hs; homeAccum.ga += as_
    awayAccum.gf += as_; awayAccum.ga += hs

    if (hs > as_) {
      homeAccum.w += 1; homeAccum.pts += 3; awayAccum.l += 1
    } else if (hs === as_) {
      homeAccum.d += 1; homeAccum.pts += 1; awayAccum.d += 1; awayAccum.pts += 1
    } else {
      awayAccum.w += 1; awayAccum.pts += 3; homeAccum.l += 1
    }

    resultsByGroup.get(groupCode)?.push({ home, away, homeScore: hs, awayScore: as_ })
  }

  const groups: StandingGroup[] = []
  const projectedRowsByGroup = userId
    ? computeProjectedStandingRowsByGroup({
      groupToTeams,
      teamAliasesByGroup,
      matches: (matchData ?? []).flatMap((match) => {
        const groupCode = resolveMatchGroupCode(match, teamToGroup)
        if (!groupCode) return []
        return [{
          id: match.id,
          groupCode,
          home: match.home_team_code,
          away: match.away_team_code,
        }]
      }),
      predictions: (predictionData ?? []).map((prediction) => ({
        matchId: prediction.match_id,
        homeScore: prediction.home_score,
        awayScore: prediction.away_score,
      })),
      buildRow: (teamCode, accum, position) =>
        mapAccumToStandingRow(
          teamCode,
          { w: accum.g, d: accum.e, l: accum.p, gf: accum.gf, ga: accum.ga, pts: accum.pts },
          position,
          teamsByCode,
          teamsByApiId,
        ),
    })
    : null

  for (const [groupCode, accumMap] of accumByGroup) {
    const sortedTeams = sortTeamsByOlympicTiebreak(
      new Map(
        [...accumMap.entries()].map(([teamCode, accum]) => [
          teamCode,
          { pts: accum.pts, gf: accum.gf, ga: accum.ga, gd: accum.gf - accum.ga },
        ]),
      ),
      resultsByGroup.get(groupCode) ?? [],
    )

    const standingRows = sortedTeams.map((teamCode, index) =>
      mapAccumToStandingRow(teamCode, accumMap.get(teamCode)!, index, teamsByCode, teamsByApiId),
    )

    const fixtures = (fixturesByGroup.get(groupCode) ?? []).map((m) =>
      mapMatchToGroupFixture(m, logoByCode),
    )

    groups.push({
      id: groupCode,
      name: `Grupo ${groupCode}`,
      matchdayLabel: "Fase de grupos",
      played: sortedTeams.reduce((sum, teamCode) => {
        const accum = accumMap.get(teamCode)!
        return sum + accum.w + accum.d + accum.l
      }, 0),
      total: sortedTeams.length * 3,
      rows: standingRows,
      projectedRows: projectedRowsByGroup?.get(groupCode),
      fixtures,
      insight: {
        title: "Sin actividad reciente",
        subtitle: "Todavía no hay predicciones para mostrar",
        pct: 0,
      },
    })
  }

  return applyBestThirdsRule(groups.sort((a, b) => a.id.localeCompare(b.id)))
}

// FIFA 2026: best 8 of 12 third-place teams advance. Rank by pts → gd → gf.
function applyBestThirdsRule(groups: StandingGroup[]): StandingGroup[] {
  const thirds = groups
    .filter((g) => g.rows.length >= 3)
    .map((g) => ({ groupId: g.id, row: g.rows[2] }))
    .sort((a, b) =>
      b.row.pts - a.row.pts ||
      (b.row.gd) - (a.row.gd) ||
      b.row.pj - a.row.pj  // more games played = further along
    )

  const top8 = new Set(thirds.slice(0, 8).map((t) => t.groupId))

  return groups.map((g) => ({
    ...g,
    rows: g.rows.map((row, i) => {
      if (i !== 2) return row
      return { ...row, qualification: top8.has(g.id) ? "playoff" : "out" } as typeof row
    }),
  }))
}
