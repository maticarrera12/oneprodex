import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { supabaseUrl } from '@/lib/supabase/config'

function requireEnv(name: 'SUPABASE_SERVICE_ROLE_KEY'): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing ${name}`)
  }

  return value
}

export function createServiceClient() {
  return createSupabaseClient(supabaseUrl, requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
