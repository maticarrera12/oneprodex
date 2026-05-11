import { getProfileData } from "@/features/profile/api"
import ProfileScreen from "@/features/profile/components/profile-screen"
import { EmptyState } from "@/features/shared/components/empty-state"
import { createClient } from "@/lib/supabase/server"

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <EmptyState message="Sin datos de perfil" />
  }

  const profileData = await getProfileData(supabase, user.id)

  if (!profileData) {
    return <EmptyState message="Sin datos de perfil" />
  }

  return <ProfileScreen data={profileData} />
}
