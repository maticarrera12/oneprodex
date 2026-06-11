import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { normalizeSearchText } from "@/lib/search"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const query = normalizeSearchText(url.searchParams.get("q") ?? "")
  const youngOnly = url.searchParams.get("young") === "1"

  if (query.length < 2) {
    return NextResponse.json({ data: [] })
  }

  const service = createServiceClient()
  let dbQuery = service
    .from("players")
    .select("api_id,name,photo_url,team_code")
    .ilike("name_search", `%${query}%`)
    .order("name", { ascending: true })
    .limit(10)

  if (youngOnly) {
    dbQuery = dbQuery.gte("date_of_birth", "2005-01-01")
  }

  const { data, error } = await dbQuery
  if (error) {
    return NextResponse.json({ error: error.message, data: [] }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [] })
}
