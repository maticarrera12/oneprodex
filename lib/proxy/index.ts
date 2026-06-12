import type { NextRequest } from 'next/server'
import { createProxyContext } from '@/lib/proxy/create-context'
import { runProxyHandlers } from '@/lib/proxy/run-handlers'

export async function runProxy(request: NextRequest) {
  const ctx = await createProxyContext(request)
  return runProxyHandlers(ctx)
}
