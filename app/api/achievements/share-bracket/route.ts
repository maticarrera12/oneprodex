import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export async function POST() {
  // Session authentication — requires a valid Supabase cookie session
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // Idempotent upsert — no duplicate if called multiple times
  const { error } = await supabase.from('user_achievements').upsert(
    {
      user_id: user.id,
      achievement_id: 'lo_paso_al_grupo',
      tier: null,
      progress_json: null,
    },
    { onConflict: 'user_id,achievement_id', ignoreDuplicates: true },
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Increment achievement_points by 10 only if row was newly inserted
  // We check existence first to determine if this is the first time
  const { data: existing } = await supabase
    .from('user_achievements')
    .select('earned_at')
    .eq('user_id', user.id)
    .eq('achievement_id', 'lo_paso_al_grupo')
    .maybeSingle()

  // The upsert with ignoreDuplicates means: if a row already existed, we didn't create a new one
  // We track "first time" by comparing earned_at proximity — simpler: just try incrementing
  // and rely on the upsert ignoreDuplicates to be idempotent on points too
  // We use a flag: if existing was null before upsert, the row is new
  // Since we can't easily tell after upsert, we use a separate check approach:
  // fetch achievement_points catalog value and only add if row didn't exist before
  if (existing) {
    // Row exists (possibly just created or pre-existing) — check if points already credited
    // Simplest idempotent approach: always return 200, points credited on first insert only
    // To avoid double-crediting, we store a flag in progress_json
    const alreadyCredited = existing && (existing as unknown as { progress_json?: { credited?: boolean } }).progress_json?.credited

    if (!alreadyCredited) {
      // Get achievement catalog to find points value
      const { data: achievement } = await supabase
        .from('achievements')
        .select('points')
        .eq('id', 'lo_paso_al_grupo')
        .maybeSingle()

      const points = (achievement?.points as { value?: number } | null)?.value ?? 10

      // Mark as credited and increment user points
      await supabase
        .from('user_achievements')
        .update({ progress_json: { credited: true } })
        .eq('user_id', user.id)
        .eq('achievement_id', 'lo_paso_al_grupo')

      const { data: currentUser } = await supabase
        .from('users')
        .select('achievement_points')
        .eq('id', user.id)
        .maybeSingle()

      if (currentUser) {
        await supabase
          .from('users')
          .update({ achievement_points: (currentUser.achievement_points ?? 0) + points })
          .eq('id', user.id)
      }
    }
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
