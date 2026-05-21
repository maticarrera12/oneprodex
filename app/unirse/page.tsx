import { getGroupByInviteCode } from '@/features/groups/api'
import { EmptyState } from '@/features/shared/components/empty-state'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'
import { redirect } from 'next/navigation'

type PageProps = { searchParams: Promise<{ code?: string; confirm?: string }> }

export default async function UnirsePage({ searchParams }: PageProps) {
  const { code, confirm } = await searchParams

  if (!code) {
    return <EmptyState message="Código de invitación inválido" />
  }

  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/unirse?code=${code}`)}`)
  }

  const supabase = createServiceClient()

  if (confirm === '1') {
    const group = await getGroupByInviteCode(supabase, code)
    if (group) {
      const { data: existing } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', group.id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (!existing) {
        await supabase.from('group_members').insert({ group_id: group.id, user_id: user.id })
      }

      redirect(`/grupo?group=${group.id}&joined=true`)
    }
  }

  const group = await getGroupByInviteCode(supabase, code)

  if (!group) {
    return <EmptyState message="No encontramos ningún grupo con ese código" />
  }

  return (
    <div className="flex flex-col items-center gap-6 py-16 text-center">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold text-foreground">¿Querés unirte al grupo?</h1>
        <p className="text-2xl font-bold text-(--color-primary)">{group.name}</p>
        <p className="text-sm text-(--color-text3)">
          {group.members} miembro{group.members !== 1 ? 's' : ''}
        </p>
      </div>

      <Link
        href={`/unirse?code=${code}&confirm=1`}
        className="rounded-xl bg-(--color-primary) px-8 py-3 text-sm font-semibold text-black"
      >
        Unirme al grupo
      </Link>
    </div>
  )
}
