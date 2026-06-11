'use server'

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { SlotId } from "@/features/onboarding/types"
import { buildTeamToGroupMap } from "@/features/onboarding/utils/team-groups"
import { createServiceClient } from "@/lib/supabase/service"
import { createClient } from "@/lib/supabase/server"
import { evaluateUser } from "@/lib/achievements/evaluate"

type GroupPickInput = {
  group_code: string
  position: number
  team_code: string
}

type BracketPickInput = {
  slot: SlotId
  team_code: string
}

type SearchPlayer = {
  api_id: number
  name: string
  photo_url: string | null
  team_code: string | null
}

const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"] as const
const SLOTS: ReadonlySet<SlotId> = new Set([
  "R32_P1",
  "R32_P2",
  "R32_P3",
  "R32_P4",
  "R32_P5",
  "R32_P6",
  "R32_P7",
  "R32_P8",
  "R32_P9",
  "R32_P10",
  "R32_P11",
  "R32_P12",
  "R32_P13",
  "R32_P14",
  "R32_P15",
  "R32_P16",
  "R16_P1",
  "R16_P2",
  "R16_P3",
  "R16_P4",
  "R16_P5",
  "R16_P6",
  "R16_P7",
  "R16_P8",
  "QF_P1",
  "QF_P2",
  "QF_P3",
  "QF_P4",
  "SF_P1",
  "SF_P2",
  "THIRD",
  "FINAL",
])

function parseJsonValue<T>(raw: FormDataEntryValue | null, fallback: T): T {
  if (typeof raw !== "string") return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function parseGroupPicks(formData: FormData): GroupPickInput[] {
  const payload = parseJsonValue<GroupPickInput[]>(formData.get("picks"), [])
  return payload.map((pick) => ({
    group_code: pick.group_code.trim().toUpperCase(),
    position: Number(pick.position),
    team_code: pick.team_code.trim().toUpperCase(),
  }))
}

function parseBestThirds(formData: FormData): string[] {
  const fromJson = parseJsonValue<string[]>(formData.get("team_codes"), [])
  if (fromJson.length > 0) {
    return fromJson.map((code) => code.trim().toUpperCase()).filter(Boolean)
  }

  const fallback = formData.get("team_codes")
  if (typeof fallback !== "string") return []
  return fallback
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean)
}

function parseBracketPicks(formData: FormData): BracketPickInput[] {
  const payload = parseJsonValue<Array<{ slot: string; team_code: string }>>(formData.get("picks"), [])
  return payload.map((pick) => ({
    slot: pick.slot as SlotId,
    team_code: pick.team_code.trim().toUpperCase(),
  }))
}

function parseAwardValue(formData: FormData, key: string): number | null {
  const value = formData.get(key)
  if (typeof value !== "string") return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return parsed
}

function validateGroupPicks(picks: GroupPickInput[]): void {
  if (picks.length === 0) throw new Error("No group picks provided")
  if (picks.length % 4 !== 0) throw new Error("Each group must have exactly 4 picks")

  const byGroup = new Map<string, GroupPickInput[]>()
  for (const pick of picks) {
    const list = byGroup.get(pick.group_code) ?? []
    list.push(pick)
    byGroup.set(pick.group_code, list)
  }

  for (const [group, picksInGroup] of byGroup) {
    if (picksInGroup.length !== 4) {
      throw new Error(`Group ${group} incomplete`)
    }

    const positions = new Set(picksInGroup.map((pick) => pick.position))
    if (positions.size !== 4 || ![1, 2, 3, 4].every((position) => positions.has(position))) {
      throw new Error(`Invalid positions in group ${group}`)
    }

    const teams = new Set(picksInGroup.map((pick) => pick.team_code))
    if (teams.size !== 4) {
      throw new Error(`Duplicate team in group ${group}`)
    }
  }
}

function validateBracketPicks(picks: BracketPickInput[]): void {
  if (picks.length !== 32) {
    throw new Error("Expected 32 bracket picks")
  }

  const slotSet = new Set<string>()
  for (const pick of picks) {
    if (!SLOTS.has(pick.slot)) {
      throw new Error(`Invalid slot ${pick.slot}`)
    }
    if (!pick.team_code) {
      throw new Error(`Missing team_code for ${pick.slot}`)
    }
    slotSet.add(pick.slot)
  }

  if (slotSet.size !== 32) {
    throw new Error("Duplicate slots in bracket picks")
  }
}

async function getAuthUserId(): Promise<string> {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  return user.id
}

export async function saveGroupPicks(formData: FormData): Promise<void> {
  const userId = await getAuthUserId()
  const picks = parseGroupPicks(formData)
  validateGroupPicks(picks)

  const service = createServiceClient()
  const teamsCountResult = await service.from("teams").select("code", { count: "exact", head: true })
  if ((teamsCountResult.count ?? 0) < 48) {
    throw new Error("Teams dataset incomplete")
  }

  const payload = picks.map((pick) => ({
    user_id: userId,
    group_code: pick.group_code,
    position: pick.position,
    team_code: pick.team_code,
    advances_as_third: false,
  }))

  const { error } = await service.from("group_picks").upsert(payload, { onConflict: "user_id,group_code,position" })
  if (error) throw new Error(error.message)

  revalidatePath("/onboarding")
}

export async function saveBestThirds(formData: FormData): Promise<void> {
  const userId = await getAuthUserId()
  const teamCodes = parseBestThirds(formData)
  if (teamCodes.length !== 8) {
    throw new Error("Select exactly 8 third-place teams")
  }

  const uniqueCodes = [...new Set(teamCodes)]
  if (uniqueCodes.length !== 8) {
    throw new Error("Duplicate third-place picks are not allowed")
  }

  const service = createServiceClient()
  const thirdRowsResult = await service
    .from("group_picks")
    .select("team_code")
    .eq("user_id", userId)
    .eq("position", 3)
    .order("group_code", { ascending: true })

  if (thirdRowsResult.error) throw new Error(thirdRowsResult.error.message)
  const availableCodes = new Set((thirdRowsResult.data ?? []).map((row) => row.team_code))
  if (availableCodes.size !== 12) {
    throw new Error("Step 1 incomplete")
  }

  for (const code of uniqueCodes) {
    if (!availableCodes.has(code)) throw new Error(`Invalid third-place team: ${code}`)
  }

  const resetResult = await service
    .from("group_picks")
    .update({ advances_as_third: false })
    .eq("user_id", userId)
    .eq("position", 3)
  if (resetResult.error) throw new Error(resetResult.error.message)

  const setResult = await service
    .from("group_picks")
    .update({ advances_as_third: true })
    .eq("user_id", userId)
    .eq("position", 3)
    .in("team_code", uniqueCodes)
  if (setResult.error) throw new Error(setResult.error.message)

  revalidatePath("/onboarding")
}

export async function saveBracketPicks(formData: FormData): Promise<void> {
  const userId = await getAuthUserId()
  const picks = parseBracketPicks(formData)
  validateBracketPicks(picks)

  const service = createServiceClient()
  const lockResult = await service.from("users").select("awards_at").eq("id", userId).maybeSingle()
  if (lockResult.error) throw new Error(lockResult.error.message)
  if (lockResult.data?.awards_at) {
    throw new Error("Forbidden: onboarding already completed")
  }

  const upsertResult = await service
    .from("bracket_picks")
    .upsert(
      picks.map((pick) => ({
        user_id: userId,
        slot: pick.slot,
        team_code: pick.team_code,
      })),
      { onConflict: "user_id,slot" }
    )
  if (upsertResult.error) throw new Error(upsertResult.error.message)

  const finalPick = picks.find((pick) => pick.slot === "FINAL")
  if (finalPick) {
    const championResult = await service.from("tournament_predictions").upsert(
      {
        user_id: userId,
        champion_code: finalPick.team_code,
      },
      { onConflict: "user_id" }
    )
    if (championResult.error) throw new Error(championResult.error.message)
  }

  revalidatePath("/onboarding")
}

export async function saveTournamentPredictions(formData: FormData): Promise<void> {
  const userId = await getAuthUserId()
  const topScorer = parseAwardValue(formData, "top_scorer_api_id")
  const bestPlayer = parseAwardValue(formData, "best_player_api_id")
  const bestYoungPlayer = parseAwardValue(formData, "best_young_player_api_id")

  if (!topScorer || !bestPlayer || !bestYoungPlayer) {
    throw new Error("All awards are required")
  }

  const service = createServiceClient()

  // Awards are immutable once all three required picks exist.
  const awardsLockResult = await service
    .from("tournament_predictions")
    .select("top_scorer_api_id,best_player_api_id,best_young_player_api_id")
    .eq("user_id", userId)
    .maybeSingle()
  if (awardsLockResult.error) throw new Error(awardsLockResult.error.message)
  const existing = awardsLockResult.data
  if (existing?.top_scorer_api_id && existing?.best_player_api_id && existing?.best_young_player_api_id) {
    throw new Error("Forbidden: awards already submitted")
  }

  const upsertResult = await service.from("tournament_predictions").upsert(
    {
      user_id: userId,
      top_scorer_api_id: topScorer,
      best_player_api_id: bestPlayer,
      best_young_player_api_id: bestYoungPlayer,
    },
    { onConflict: "user_id" }
  )
  if (upsertResult.error) throw new Error(upsertResult.error.message)

  const submitResult = await service
    .from("users")
    .update({ awards_at: new Date().toISOString() })
    .eq("id", userId)
  if (submitResult.error) throw new Error(submitResult.error.message)

  await evaluateUser(userId, service)

  revalidatePath("/onboarding")
  revalidatePath("/grupo")
}

export async function setOnboardingMode(formData: FormData): Promise<void> {
  const rawMode = formData.get("mode")
  if (rawMode !== "prode" && rawMode !== "quick") {
    throw new Error("Invalid onboarding mode. Expected 'prode' or 'quick'.")
  }
  const mode = rawMode as "prode" | "quick"
  const userId = await getAuthUserId()
  const service = createServiceClient()
  const { error } = await service.from("users").update({ onboarding_mode: mode }).eq("id", userId)
  if (error) throw new Error(error.message)
  revalidatePath("/onboarding")
}

export async function continueFromProdePicks(): Promise<void> {
  const userId = await getAuthUserId()
  const service = createServiceClient()
  const { error } = await service
    .from("users")
    .update({ prode_picks_submitted_at: new Date().toISOString() })
    .eq("id", userId)
  if (error) throw new Error(error.message)

  revalidatePath("/onboarding")
}

export async function saveMatchScorePick(formData: FormData): Promise<void> {
  const matchId = formData.get("match_id") as string
  const homeScore = Number(formData.get("home_score"))
  const awayScore = Number(formData.get("away_score"))

  const userId = await getAuthUserId()
  const service = createServiceClient()

  // Verify this is a group-stage match before saving
  const { data: matchRow, error: matchLookupError } = await service
    .from("matches")
    .select("id,stage")
    .eq("id", matchId)
    .maybeSingle()

  if (matchLookupError) throw new Error(matchLookupError.message)
  if (!matchRow?.stage?.toLowerCase().includes("group stage")) throw new Error("Not a group-stage match")

  const { error } = await service.from("predictions").upsert(
    { user_id: userId, match_id: matchId, home_score: homeScore, away_score: awayScore },
    { onConflict: "user_id,match_id" }
  )
  if (error) throw new Error(error.message)

  // Recalculate derived standings from all group-stage predictions so far (partial is fine)
  await deriveAndPersistGroupRankings(userId)

  revalidatePath("/onboarding")
  revalidatePath("/standings")
}

export async function deriveAndPersistGroupRankings(userId: string): Promise<void> {
  const service = createServiceClient()

  // Fetch all group-stage predictions for this user (partial fills are fine)
  const { data: predictionRows, error: predError } = await service
    .from("predictions")
    .select("match_id,home_score,away_score,matches!inner(stage)")
    .eq("user_id", userId)
    .ilike("matches.stage", "Group Stage%")

  if (predError || !predictionRows || predictionRows.length === 0) return

  const matchIds = predictionRows.map((row) => row.match_id)

  const [matchesResult, standingsResult, teamsResult] = await Promise.all([
    service.from("matches").select("id,home_team_code,away_team_code").in("id", matchIds),
    service.from("standings").select("group_code,team_code"),
    service.from("teams").select("api_id,code"),
  ])

  if (matchesResult.error || !matchesResult.data) return

  // matches.stage only encodes the matchday ("Group Stage - 1/2/3"), so the
  // group must come from the standings team→group mapping.
  const teamToGroup = buildTeamToGroupMap(standingsResult.data ?? [], teamsResult.data ?? [])

  const matchRows = matchesResult.data.map((m) => {
    const home = m.home_team_code.trim().toUpperCase()
    const away = m.away_team_code.trim().toUpperCase()
    return {
      id: m.id,
      home_team_code: home,
      away_team_code: away,
      group_code: teamToGroup.get(home) ?? teamToGroup.get(away) ?? null,
    }
  })

  // Compute group standings using pure function
  const { computeGroupStandings } = await import("@/features/onboarding/utils/group-standings")
  const rankings = computeGroupStandings(predictionRows, matchRows)

  // Upsert group_picks rows (positions 1-4 per group)
  const groupPicksPayload: Array<{
    user_id: string
    group_code: string
    position: number
    team_code: string
    advances_as_third: boolean
  }> = []

  const allThirds: Array<{ group_code: string; team_code: string; pts: number; gd: number; gf: number }> = []

  for (const [groupCode, teams] of Object.entries(rankings)) {
    for (let i = 0; i < teams.length; i++) {
      const teamCode = teams[i]
      if (!teamCode) continue
      groupPicksPayload.push({
        user_id: userId,
        group_code: groupCode,
        position: i + 1,
        team_code: teamCode,
        advances_as_third: false,
      })
      if (i === 2) {
        // position 3 (third-place teams)
        const stats = computeTeamStats(predictionRows, matchRows, groupCode, teamCode)
        allThirds.push({ group_code: groupCode, team_code: teamCode, ...stats })
      }
    }
  }

  // Determine best 8 thirds
  const sortedThirds = allThirds.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts
    if (b.gd !== a.gd) return b.gd - a.gd
    if (b.gf !== a.gf) return b.gf - a.gf
    return a.team_code.localeCompare(b.team_code)
  })
  const best8Codes = new Set(sortedThirds.slice(0, 8).map((t) => t.team_code))

  // Mark advances_as_third for best 8
  for (const pick of groupPicksPayload) {
    if (pick.position === 3 && best8Codes.has(pick.team_code)) {
      pick.advances_as_third = true
    }
  }

  // Upsert (not delete+insert): concurrent autosaves would interleave the
  // delete/insert pair and crash on duplicate key. Rows per group never
  // shrink (predictions are never deleted), so no stale rows are left behind.
  const { error: upsertError } = await service
    .from("group_picks")
    .upsert(groupPicksPayload, { onConflict: "user_id,group_code,position" })

  if (upsertError) throw new Error(upsertError.message)
}

type PredictionRow = { match_id: string; home_score: number; away_score: number }
type MatchRow = { id: string; group_code: string | null; home_team_code: string; away_team_code: string }

function computeTeamStats(
  predictions: PredictionRow[],
  matches: MatchRow[],
  groupCode: string,
  teamCode: string
): { pts: number; gd: number; gf: number } {
  let pts = 0
  let gd = 0
  let gf = 0

  const groupMatches = matches.filter((m) => m.group_code === groupCode)
  for (const match of groupMatches) {
    const isHome = match.home_team_code === teamCode
    const isAway = match.away_team_code === teamCode
    if (!isHome && !isAway) continue

    const pred = predictions.find((p) => p.match_id === match.id)
    if (!pred) continue

    const [scored, conceded] = isHome
      ? [pred.home_score, pred.away_score]
      : [pred.away_score, pred.home_score]

    gf += scored
    gd += scored - conceded

    if (scored > conceded) pts += 3
    else if (scored === conceded) pts += 1
  }

  return { pts, gd, gf }
}

export async function searchPlayers(query: string): Promise<SearchPlayer[]> {
  const text = query.trim()
  if (text.length < 2) return []

  const service = createServiceClient()
  const { data, error } = await service
    .from("players")
    .select("api_id,name,photo_url,team_code")
    .ilike("name", `%${text}%`)
    .order("name", { ascending: true })
    .limit(10)

  if (error || !data) return []
  return data
}

export async function searchYoungPlayers(query: string): Promise<SearchPlayer[]> {
  const text = query.trim()
  if (text.length < 2) return []

  const service = createServiceClient()
  const { data, error } = await service
    .from("players")
    .select("api_id,name,photo_url,team_code")
    .gte("date_of_birth", "2005-01-01")
    .ilike("name", `%${text}%`)
    .order("name", { ascending: true })
    .limit(10)

  if (error || !data) return []
  return data
}
