'use server'

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { SlotId } from "@/features/onboarding/types"
import { createServiceClient } from "@/lib/supabase/service"
import { createClient } from "@/lib/supabase/server"

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
  const lockResult = await service.from("users").select("bracket_submitted_at").eq("id", userId).maybeSingle()
  if (lockResult.error) throw new Error(lockResult.error.message)
  if (lockResult.data?.bracket_submitted_at) {
    throw new Error("Forbidden: bracket already submitted")
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
  const lockResult = await service.from("users").select("bracket_submitted_at").eq("id", userId).maybeSingle()
  if (lockResult.error) throw new Error(lockResult.error.message)
  if (lockResult.data?.bracket_submitted_at) {
    throw new Error("Forbidden: bracket already submitted")
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
    .update({ bracket_submitted_at: new Date().toISOString() })
    .eq("id", userId)
  if (submitResult.error) throw new Error(submitResult.error.message)

  revalidatePath("/onboarding")
  revalidatePath("/grupo")
  redirect("/grupo")
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
