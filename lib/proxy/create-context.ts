import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { ProxyContext } from '@/lib/proxy/types'
import { supabasePublishableKey, supabaseUrl } from '@/lib/supabase/config'

export async function createProxyContext(request: NextRequest): Promise<ProxyContext> {
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        )
      },
    },
  })

  // IMPORTANTE: no agregar código entre createServerClient y supabase.auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return {
    request,
    supabase,
    user,
    pathname: request.nextUrl.pathname,
    supabaseResponse,
  }
}
