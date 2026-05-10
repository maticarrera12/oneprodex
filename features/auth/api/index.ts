import { createClient } from '@/lib/supabase/client'

export async function signInWithGoogle() {
  const supabase = createClient()
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${location.origin}/auth/callback` },
  })
}

export async function signInWithDiscord() {
  const supabase = createClient()
  return supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: { redirectTo: `${location.origin}/auth/callback` },
  })
}

export async function signOut() {
  const supabase = createClient()
  return supabase.auth.signOut()
}
