export function isAuthRoute(pathname: string): boolean {
  return pathname === '/login'
}

export function isOnboardingRoute(pathname: string): boolean {
  return pathname === '/onboarding'
}

export function isPublicRoute(pathname: string): boolean {
  return (
    isAuthRoute(pathname) ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/opengraph-image') ||
    pathname.startsWith('/twitter-image')
  )
}

export function isUnirseRoute(pathname: string): boolean {
  return pathname.startsWith('/unirse')
}
