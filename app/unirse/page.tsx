import { getGroupByInviteCode } from '@/features/groups/api'
import { normalizeInviteCode } from '@/features/groups/utils/invite-code'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { evaluateUser } from '@/lib/achievements/evaluate'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'

type PageProps = { searchParams: Promise<{ code?: string; confirm?: string }> }

export default async function UnirsePage({ searchParams }: PageProps) {
  const { code, confirm } = await searchParams
  const normalizedCode = normalizeInviteCode(code)

  if (!normalizedCode) {
    return <InviteStatusCard title="Código inválido" message="Abrí un link de invitación válido para unirte a un grupo." />
  }

  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/unirse?code=${normalizedCode}`)}`)
  }

  const supabase = createServiceClient()

  if (confirm === '1') {
    const group = await getGroupByInviteCode(supabase, normalizedCode)
    if (group) {
      const { data: existing } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', group.id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (!existing) {
        await supabase.from('group_members').insert({
          group_id: group.id,
          user_id: user.id,
          invited_by: group.owner_id,
        })
        await Promise.all([
          evaluateUser(user.id, supabase),
          evaluateUser(group.owner_id, supabase),
        ])
      }

      redirect(`/grupo?group=${group.id}&joined=true`)
    }
  }

  const group = await getGroupByInviteCode(supabase, normalizedCode)

  if (!group) {
    return <InviteStatusCard title="No encontramos ese grupo" message="Revisá el link o pedile a quien te invitó que te lo comparta de nuevo." />
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-8">
      <section className="relative w-full max-w-md overflow-hidden rounded-3xl border border-(--color-border-hi) bg-(--color-card-hi) shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <Image
          src="/fondo-podio.png"
          alt=""
          fill
          sizes="448px"
          className="object-cover opacity-45"
          priority
        />
        <div aria-hidden="true" className="absolute inset-0 bg-linear-to-b from-background/35 via-background/78 to-background/96" />
        <div aria-hidden="true" className="absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />

        <div className="relative space-y-6 p-5 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-primary/35 bg-primary/15 shadow-[0_0_32px_rgba(190,242,100,0.18)]">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="text-primary">
              <path d="M12 3 20 7.5v9L12 21l-8-4.5v-9L12 3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
              <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </div>

          <div className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">Invitación de grupo</p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Sumate al grupo</h1>
            <p className="text-3xl font-black tracking-tight text-primary">{group.name}</p>
            <p className="mx-auto max-w-xs text-sm leading-relaxed text-(--color-text2)">
              Vas a entrar al grupo para competir, comparar predicciones y ver el consenso de los partidos.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-(--color-border-hi) bg-background/55 px-3 py-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-(--color-text3)">Miembros</p>
              <p className="mt-1 font-mono text-xl font-semibold text-foreground">{group.members}</p>
            </div>
            <div className="rounded-2xl border border-(--color-border-hi) bg-background/55 px-3 py-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-(--color-text3)">Código</p>
              <p className="mt-1 font-mono text-xl font-semibold text-foreground">{normalizedCode}</p>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <Link
              href={`/unirse?code=${encodeURIComponent(normalizedCode)}&confirm=1`}
              className="block w-full rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-[0_10px_28px_rgba(190,242,100,0.25)] transition hover:bg-primary/90"
            >
              Unirme al grupo
            </Link>
            <Link
              href="/grupo"
              className="block w-full rounded-xl border border-(--color-border-hi) bg-background/55 px-8 py-3 text-sm font-semibold text-(--color-text2) transition hover:bg-(--color-card-hi)"
            >
              Ver mis grupos
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

function InviteStatusCard({ title, message }: { title: string; message: string }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-8">
      <section className="w-full max-w-md rounded-3xl border border-(--color-border-hi) bg-(--color-card-hi) p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl border border-red-400/25 bg-red-500/10 text-red-300">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M12 8v5M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-(--color-text3)">{message}</p>
        <Link
          href="/grupo"
          className="mt-5 block rounded-xl border border-(--color-border-hi) bg-(--color-bg2) px-5 py-3 text-sm font-semibold text-(--color-text2)"
        >
          Ir a grupos
        </Link>
      </section>
    </main>
  )
}
