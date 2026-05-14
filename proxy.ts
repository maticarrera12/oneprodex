import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { supabasePublishableKey, supabaseUrl } from '@/lib/supabase/config'

export async function proxy(request: NextRequest) {
  const onboardingEnabled = process.env.NEXT_PUBLIC_ONBOARDING_ENABLED === 'true'
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    supabaseUrl,
    supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: no agregar código entre createServerClient y supabase.auth.getUser()
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isAuthRoute = pathname === '/login'
  const isOnboardingRoute = pathname === '/onboarding'
  const isPublicRoute = isAuthRoute || pathname.startsWith('/auth/') || pathname.startsWith('/api/')

  if (!user && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (user && onboardingEnabled) {
    const { data: profile } = await supabase
      .from('users')
      .select('bracket_submitted_at')
      .eq('id', user.id)
      .maybeSingle()

    const hasSubmittedBracket = Boolean(profile?.bracket_submitted_at)

    if (!hasSubmittedBracket && !isOnboardingRoute && !pathname.startsWith('/api/')) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    if (hasSubmittedBracket && isOnboardingRoute) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
