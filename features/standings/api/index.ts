import type { SupabaseClient } from "@supabase/supabase-js"
import type { StandingGroup, StandingQualification, StandingRow } from "@/features/standings/types"
import type { Database } from "@/lib/supabase/database.types"

type StandingDbRow = Database["public"]["Tables"]["standings"]["Row"]

function resolveQualification(position: number): StandingQualification {
  if (position < 2) return "qual"
  if (position === 2) return "playoff"
  return "out"
}

function mapStandingRow(row: StandingDbRow, position: number): StandingRow {
  return {
    team: row.team_code,
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
    rows: [...rows].sort((a, b) => b.points - a.points).map((row, index) => mapStandingRow(row, index)),
    fixtures: [],
    insight: {
      title: "Sin actividad reciente",
      subtitle: "Todavía no hay predicciones para mostrar",
      pct: 0,
    },
  }))
}
