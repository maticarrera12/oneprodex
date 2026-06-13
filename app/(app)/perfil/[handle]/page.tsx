import { notFound, redirect } from "next/navigation"
import { getBracketData } from "@/features/bracket/api"
import { getProfileData, getFriendPredictionsTab, getUserByHandle } from "@/features/profile/api"
import { FriendProfileTabs } from "@/features/profile/components/friend-profile-tabs"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

type Props = {
  params: Promise<{ handle: string }>
}

export default async function FriendProfilePage({ params }: Props) {
  const { handle } = await params

  // 1. Auth guard — unauthenticated → redirect login
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const service = createServiceClient()

  // 2. Resolve handle → userId
  const friendUserId = await getUserByHandle(service, handle)

  if (!friendUserId) {
    notFound()
  }

  // 3. Own handle → redirect to own profile
  if (friendUserId === user.id) {
    redirect("/perfil")
  }

  // 4. Parallel data fetch
  const [profileData, bracketData, predictionsData] = await Promise.all([
    getProfileData(service, friendUserId),
    getBracketData(service, friendUserId),
    getFriendPredictionsTab(service, friendUserId),
  ])

  if (!profileData) {
    notFound()
  }

  return (
    <div className="space-y-4 pt-4 pb-8">
      <FriendProfileTabs
        profileData={profileData}
        bracketData={bracketData}
        predictionsData={predictionsData}
      />
    </div>
  )
}
