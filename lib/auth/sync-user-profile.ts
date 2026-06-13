import type { User } from "@supabase/supabase-js"

import { createServiceClient } from "@/lib/supabase/service"

export function getAuthAvatarUrl(user: User): string | null {
  const metadata = user.user_metadata as Record<string, unknown> | undefined
  const avatar = metadata?.avatar_url ?? metadata?.picture
  return typeof avatar === "string" && avatar.length > 0 ? avatar : null
}

export function getAuthDisplayName(user: User): string {
  const metadata = user.user_metadata as Record<string, unknown> | undefined
  const fromMetadata = metadata?.full_name ?? metadata?.name
  if (typeof fromMetadata === "string" && fromMetadata.length > 0) return fromMetadata
  return user.email?.split("@")[0] ?? "User"
}

export async function syncUserProfileFromAuth(user: User): Promise<void> {
  const service = createServiceClient()
  const display_name = getAuthDisplayName(user)
  const avatar_url = getAuthAvatarUrl(user)
  const handle =
    (typeof user.user_metadata?.user_name === "string" && user.user_metadata.user_name) ||
    user.email?.split("@")[0] ||
    user.id.slice(0, 8)

  await service.from("users").upsert({ id: user.id, display_name, handle, avatar_url }, { onConflict: "id" })
}
