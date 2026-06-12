import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/lib/supabase/database.types'

export type ProxyContext = {
  request: NextRequest
  supabase: SupabaseClient<Database>
  user: User | null
  pathname: string
  supabaseResponse: NextResponse
}

/** Returns a redirect/response to short-circuit, or null to continue the chain. */
export type ProxyHandler = (ctx: ProxyContext) => Promise<NextResponse | null>
