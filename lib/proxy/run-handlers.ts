import type { NextResponse } from 'next/server'
import { authHandler } from '@/lib/proxy/handlers/auth'
import { onboardingHandler } from '@/lib/proxy/handlers/onboarding'
import type { ProxyContext, ProxyHandler } from '@/lib/proxy/types'

const handlers: ProxyHandler[] = [authHandler, onboardingHandler]

export async function runProxyHandlers(ctx: ProxyContext): Promise<NextResponse> {
  for (const handler of handlers) {
    const result = await handler(ctx)
    if (result) return result
  }

  return ctx.supabaseResponse
}
