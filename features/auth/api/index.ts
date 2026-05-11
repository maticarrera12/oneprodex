import { createClient } from '@/lib/supabase/client'

export async function signInWithGoogle(next?: string) {
  const supabase = createClient()
  const redirectTo = next
    ? `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`
    : `${location.origin}/auth/callback`
  return supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })
}

export async function signInWithDiscord(next?: string) {
  const supabase = createClient()
  const redirectTo = next
    ? `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`
    : `${location.origin}/auth/callback`
  return supabase.auth.signInWithOAuth({ provider: 'discord', options: { redirectTo } })
}

export async function signOut() {
  const supabase = createClient()
  return supabase.auth.signOut()
}
