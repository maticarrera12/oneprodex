'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { useState } from 'react'
import { GroupModal } from '@/features/groups/components/group-modal'

type Tab = 'create' | 'join'

export function GroupEmpty() {
  const [modalOpen, setModalOpen] = useState(false)
  const [defaultTab, setDefaultTab] = useState<Tab>('create')

  function open(tab: Tab) {
    setDefaultTab(tab)
    setModalOpen(true)
  }

  return (
    <div className="flex min-h-[calc(100dvh-150px)] items-center justify-center py-6">
      <section className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-(--color-border-hi) bg-(--color-card-hi) shadow-[0_24px_80px_rgba(0,0,0,0.34)]">
        <Image
          src="/fondo-podio.png"
          alt=""
          fill
          sizes="576px"
          className="object-cover opacity-45"
          priority
        />
        <div aria-hidden="true" className="absolute inset-0 bg-linear-to-b from-background/30 via-background/76 to-background/96" />
        <div aria-hidden="true" className="absolute -top-24 left-1/2 size-80 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div aria-hidden="true" className="absolute right-4 top-4 font-mono text-[84px] font-black leading-none text-primary/10">GRP</div>

        <div className="relative space-y-6 p-5 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-primary/35 bg-primary/15 shadow-[0_0_32px_rgba(190,242,100,0.18)]">
            <svg width="31" height="31" viewBox="0 0 24 24" fill="none" className="text-primary">
              <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="1.6" />
              <path d="M3.5 19c.7-3 2.4-4.5 4.5-4.5s3.8 1.5 4.5 4.5M11.5 19c.7-3 2.4-4.5 4.5-4.5s3.8 1.5 4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>

          <div className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">Grupos privados</p>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Armá tu mesa mundialista</h1>
            <p className="mx-auto max-w-sm text-sm leading-relaxed text-(--color-text2)">
              Creá un grupo para competir con amigos o unite con un código de invitación para comparar predicciones.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <ActionCard
              title="Crear grupo"
              description="Poné nombre, compartí el link y empezá a sumar gente."
              cta="Crear grupo"
              primary
              onClick={() => open('create')}
            />
            <ActionCard
              title="Unirme"
              description="Usá un código o link que te hayan compartido."
              cta="Unirme con código"
              onClick={() => open('join')}
            />
          </div>
      </div>
      </section>

      <GroupModal open={modalOpen} onClose={() => setModalOpen(false)} defaultTab={defaultTab} showTabs={false} />
    </div>
  )
}

function ActionCard({
  title,
  description,
  cta,
  primary = false,
  onClick,
}: {
  title: string
  description: string
  cta: string
  primary?: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`group rounded-2xl border p-4 text-left transition ${
        primary
          ? 'border-primary/40 bg-primary/15 shadow-[0_12px_34px_rgba(190,242,100,0.14)]'
          : 'border-(--color-border-hi) bg-background/55 hover:bg-(--color-card-hi)'
      }`}
    >
      <p className={`text-base font-bold ${primary ? 'text-primary' : 'text-foreground'}`}>{title}</p>
      <p className="mt-1 min-h-10 text-xs leading-relaxed text-(--color-text3)">{description}</p>
      <span
        className={`mt-4 inline-flex w-full items-center justify-center rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
          primary
            ? 'bg-primary text-primary-foreground group-hover:bg-primary/90'
            : 'border border-(--color-border-hi) bg-(--color-bg2) text-(--color-text2)'
        }`}
      >
        {cta}
      </span>
    </motion.button>
  )
}
