import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { evaluateUser } from '@/lib/achievements/evaluate'

export async function POST() {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const service = createServiceClient()
    await evaluateUser(user.id, service)
    return NextResponse.json({ ok: true, userId: user.id })
  } catch (error) {
    console.error('[achievements/me] evaluation failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
