import type { SupabaseClient } from "@supabase/supabase-js"
import type { GroupInfo } from "@/features/groups/types"
import type { RankingEntry } from "@/features/rankings/types"
import { normalizeInviteCode } from "@/features/groups/utils/invite-code"
import type { Database } from "@/lib/supabase/database.types"

type GroupRow = Database["public"]["Tables"]["groups"]["Row"]
type LeaderboardRpcRow = Database["public"]["Functions"]["get_group_leaderboard"]["Returns"][number]

function mapGroupToInfo(group: GroupRow, membersCount: number): GroupInfo {
  return {
    id: group.id,
    name: group.name,
    owner_id: group.owner_id,
    members: membersCount,
    matchday: "Jornada actual",
    invite_code: group.invite_code,
    image_url: group.image_url ?? null,
    description: group.description ?? null,
  }
}

function mapLeaderboardRow(row: LeaderboardRpcRow, rank: number, userId: string): RankingEntry {
  return {
    rank: rank + 1,
    handle: row.handle,
    name: row.display_name,
    color: "hsl(83 81% 62%)",
    pts: row.total_pts,
    hits: row.correct_count,
    acc: 0,
    streak: 0,
    delta: 0,
    isYou: row.user_id === userId,
  }
}

export async function getUserGroups(supabase: SupabaseClient<Database>, userId: string): Promise<GroupInfo[]> {
  const { data: memberships, error: membershipsError } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId)
    .order("joined_at", { ascending: true })

  if (membershipsError || !memberships || memberships.length === 0) return []

  const groupIds = memberships.map((membership) => membership.group_id)
  const { data: groups, error: groupsError } = await supabase.from("groups").select("*").in("id", groupIds)
  if (groupsError || !groups || groups.length === 0) return []

  const { data: memberRows } = await supabase.from("group_members").select("group_id").in("group_id", groupIds)

  const membersPerGroup = (memberRows ?? []).reduce<Record<string, number>>((acc, membership) => {
    acc[membership.group_id] = (acc[membership.group_id] ?? 0) + 1
    return acc
  }, {})

  return groups.map((group) => mapGroupToInfo(group, membersPerGroup[group.id] ?? 0))
}

export async function getActiveGroupId(supabase: SupabaseClient<Database>, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  return data.group_id
}

export async function getGroupInfo(supabase: SupabaseClient<Database>, groupId: string): Promise<GroupInfo | null> {
  const [groupResult, membersResult] = await Promise.all([
    supabase.from("groups").select("*").eq("id", groupId).maybeSingle(),
    supabase.from("group_members").select("user_id").eq("group_id", groupId),
  ])

  if (groupResult.error || !groupResult.data) return null
  if (membersResult.error || !membersResult.data) return mapGroupToInfo(groupResult.data, 0)

  return mapGroupToInfo(groupResult.data, membersResult.data.length)
}

export async function getGroupByInviteCode(
  supabase: SupabaseClient<Database>,
  inviteCode: string
): Promise<GroupInfo | null> {
  const normalizedCode = normalizeInviteCode(inviteCode)
  if (!normalizedCode) return null

  const [groupResult] = await Promise.all([
    supabase.from("groups").select("*").eq("invite_code", normalizedCode).maybeSingle(),
  ])

  if (groupResult.error || !groupResult.data) return null

  const { data: members } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupResult.data.id)

  return mapGroupToInfo(groupResult.data, members?.length ?? 0)
}

export async function getGroupLeaderboard(
  supabase: SupabaseClient<Database>,
  groupId: string,
  userId = ""
): Promise<RankingEntry[]> {
  const { data, error } = await supabase.rpc("get_group_leaderboard", { p_group_id: groupId })
  if (error || !data) return []
  return data.map((row, index) => mapLeaderboardRow(row, index, userId))
}
