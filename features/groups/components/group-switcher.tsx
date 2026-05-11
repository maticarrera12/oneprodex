'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import type { GroupInfo } from '@/features/groups/types'

type GroupSwitcherProps = {
  groups: GroupInfo[]
  activeId: string
  open: boolean
  onClose: () => void
}

export function GroupSwitcher({ groups, activeId, open, onClose }: GroupSwitcherProps) {
  const router = useRouter()

  if (!open) return null

  function navigate(id: string) {
    onClose()
    router.push(`/grupo?group=${id}`)
  }

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <motion.div
        className="absolute left-1/2 top-full z-40 mt-2 w-56 -translate-x-1/2 rounded-2xl border border-(--color-border-hi) bg-(--color-card-hi) py-1 shadow-xl"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
      >
        {groups.map((group) => {
          const isActive = group.id === activeId
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => navigate(group.id)}
              className={`w-full px-4 py-2.5 text-left text-sm ${
                isActive
                  ? 'bg-(--color-lime-bg) font-semibold text-(--color-lime-hi)'
                  : 'text-foreground'
              }`}
            >
              {group.name}
            </button>
          )
        })}
      </motion.div>
    </>
  )
}
