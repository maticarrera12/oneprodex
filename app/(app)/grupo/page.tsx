import { getGroupLeaderboard, getUserGroups } from '@/features/groups/api'
import { GroupEmpty } from '@/features/groups/components/group-empty'
import { GroupLeaderboardScreen } from '@/features/groups/components/group-leaderboard-screen'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

type PageProps = { searchParams: Promise<{ group?: string }> }

export default async function GroupPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const groups = await getUserGroups(supabase, user.id)

  if (groups.length === 0) {
    return <GroupEmpty />
  }

  const { group: groupId } = await searchParams
  const activeGroup = groups.find((g) => g.id === groupId) ?? groups[0]

  const leaderboard = await getGroupLeaderboard(supabase, activeGroup.id, user.id)
  const isOwner = activeGroup.owner_id === user.id

  return <GroupLeaderboardScreen group={activeGroup} leaderboard={leaderboard} groups={groups} isOwner={isOwner} />
}
