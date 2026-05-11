'use client'

import { motion } from 'framer-motion'
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
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="text-base font-semibold text-foreground">No pertenecés a ningún grupo</p>
      <p className="text-sm text-(--color-text3)">Creá uno o unite con un código de invitación.</p>

      <div className="mt-2 flex flex-col gap-3 w-full max-w-xs">
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => open('create')}
          className="w-full rounded-xl bg-(--color-lime-hi) py-3 text-sm font-semibold text-black"
        >
          Crear grupo
        </motion.button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => open('join')}
          className="w-full rounded-xl border border-(--color-border-hi) bg-(--color-card-hi) py-3 text-sm font-semibold text-(--color-text3)"
        >
          Unirme con código
        </motion.button>
      </div>

      <GroupModal open={modalOpen} onClose={() => setModalOpen(false)} defaultTab={defaultTab} />
    </div>
  )
}
