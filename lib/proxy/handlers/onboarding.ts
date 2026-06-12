import { NextResponse } from 'next/server'
import type { ProxyHandler } from '@/lib/proxy/types'
import { isOnboardingRoute, isUnirseRoute } from '@/lib/proxy/route-matchers'

export const onboardingHandler: ProxyHandler = async ({ request, user, supabase, pathname }) => {
  const onboardingEnabled = process.env.NEXT_PUBLIC_ONBOARDING_ENABLED === 'true'
  if (!user || !onboardingEnabled) return null

  const { data: profile } = await supabase
    .from('users')
    .select('awards_at')
    .eq('id', user.id)
    .maybeSingle()

  const hasCompletedAwards = Boolean(profile?.awards_at)

  if (
    !hasCompletedAwards &&
    !isOnboardingRoute(pathname) &&
    !isUnirseRoute(pathname) &&
    !pathname.startsWith('/api/')
  ) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  if (hasCompletedAwards && isOnboardingRoute(pathname)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return null
}
