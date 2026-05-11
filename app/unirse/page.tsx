import { getGroupByInviteCode } from '@/features/groups/api'
import { joinGroup } from '@/features/groups/actions'
import { EmptyState } from '@/features/shared/components/empty-state'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

type PageProps = { searchParams: Promise<{ code?: string }> }

export default async function UnirsePage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { code } = await searchParams

  if (!code) {
    return <EmptyState message="Código de invitación inválido" />
  }

  const group = await getGroupByInviteCode(supabase, code)

  if (!group) {
    return <EmptyState message="No encontramos ningún grupo con ese código" />
  }

  return (
    <div className="flex flex-col items-center gap-6 py-16 text-center">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold text-foreground">¿Querés unirte al grupo?</h1>
        <p className="text-2xl font-bold text-(--color-lime-hi)">{group.name}</p>
        <p className="text-sm text-(--color-text3)">{group.members} miembro{group.members !== 1 ? 's' : ''}</p>
      </div>

      <form action={joinGroup}>
        <input type="hidden" name="code" value={code} />
        <button
          type="submit"
          className="rounded-xl bg-(--color-lime-hi) px-8 py-3 text-sm font-semibold text-black"
        >
          Unirme al grupo
        </button>
      </form>
    </div>
  )
}
