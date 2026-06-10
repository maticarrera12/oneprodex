import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { evaluateUser } from '@/lib/achievements/evaluate'

export async function POST() {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  const { data: existing } = await service
    .from('users')
    .select('share_link_sent_at')
    .eq('id', user.id)
    .maybeSingle()

  if (!existing?.share_link_sent_at) {
    await service
      .from('users')
      .update({ share_link_sent_at: new Date().toISOString() })
      .eq('id', user.id)
  }

  await evaluateUser(user.id, service)
  return NextResponse.json({ ok: true })
}
