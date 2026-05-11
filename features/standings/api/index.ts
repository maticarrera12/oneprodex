import type { SupabaseClient } from "@supabase/supabase-js"
import type { StandingGroup, StandingQualification, StandingRow } from "@/features/standings/types"
import type { Database } from "@/lib/supabase/database.types"

type StandingDbRow = Database["public"]["Tables"]["standings"]["Row"]
type TeamVisualRow = Pick<Database["public"]["Tables"]["teams"]["Row"], "api_id" | "code" | "logo" | "name" | "c1" | "c2" | "c3">

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

function resolveQualification(position: number): StandingQualification {
  if (position < 2) return "qual"
  if (position === 2) return "playoff"
  return "out"
}

function mapStandingRow(
  row: StandingDbRow,
  position: number,
  teamsByCode: Map<string, TeamVisualRow>,
  teamsByApiId: Map<string, TeamVisualRow>
): StandingRow {
  const rawTeamKey = row.team_code.trim()
  const teamCode = normalizeTeamCode(rawTeamKey)
  const team = teamsByCode.get(teamCode) ?? teamsByApiId.get(rawTeamKey)
  return {
    team: team?.code ?? teamCode,
    teamName: team?.name ?? null,
    logo: normalizeLogoUrl(team?.logo ?? null),
    c1: team?.c1 ?? null,
    c2: team?.c2 ?? null,
    c3: team?.c3 ?? null,
    pj: row.played,
    g: row.won,
    e: row.drawn,
    p: row.lost,
    gd: row.goals_for - row.goals_against,
    pts: row.points,
    form: [],
    qualification: resolveQualification(position),
  }
}

export async function getStandingsByGroup(supabase: SupabaseClient<Database>): Promise<StandingGroup[]> {
  const { data, error } = await supabase
    .from("standings")
    .select("*")
    .order("group_code", { ascending: true })
    .order("points", { ascending: false })

  if (error || !data || data.length === 0) return []

  const { data: teams } = await supabase.from("teams").select("api_id,code,logo,name,c1,c2,c3")
  const teamsByCode = new Map((teams ?? []).map((team) => [normalizeTeamCode(team.code), team] as const))
  const teamsByApiId = new Map(
    (teams ?? [])
      .filter((team): team is TeamVisualRow & { api_id: number } => typeof team.api_id === "number")
      .map((team) => [String(team.api_id), team] as const)
  )

  const grouped = data.reduce<Record<string, StandingDbRow[]>>((acc, row) => {
    const key = row.group_code
    acc[key] = acc[key] ?? []
    acc[key].push(row)
    return acc
  }, {})

  return Object.entries(grouped).map(([groupCode, rows]) => ({
    id: groupCode,
    name: `Grupo ${groupCode}`,
    matchdayLabel: "Fase de grupos",
    played: rows.reduce((total, row) => total + row.played, 0),
    total: rows.length * 3,
    rows: [...rows]
      .sort((a, b) => b.points - a.points)
      .map((row, index) => mapStandingRow(row, index, teamsByCode, teamsByApiId)),
    fixtures: [],
    insight: {
      title: "Sin actividad reciente",
      subtitle: "Todavía no hay predicciones para mostrar",
      pct: 0,
    },
  }))
}
