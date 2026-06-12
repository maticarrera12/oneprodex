import { NextResponse } from 'next/server'
import type { ProxyHandler } from '@/lib/proxy/types'
import { isAuthRoute, isPublicRoute } from '@/lib/proxy/route-matchers'

export const authHandler: ProxyHandler = async ({ request, user, pathname }) => {
  if (!user && !isPublicRoute(pathname)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  if (user && isAuthRoute(pathname)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return null
}
