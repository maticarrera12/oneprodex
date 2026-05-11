'use client'

import Link from 'next/link'
import { useState } from 'react'
import { GroupSwitcher } from '@/features/groups/components/group-switcher'
import type { GroupInfo } from '@/features/groups/types'

type GroupHeaderProps = {
  name: string
  members: number
  onAdd: () => void
  groups?: GroupInfo[]
  activeId?: string
}

export function GroupHeader({ name, members, onAdd, groups = [], activeId = '' }: GroupHeaderProps) {
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const hasMultiple = groups.length > 1

  return (
    <header className="grid grid-cols-[40px_1fr_40px] items-center gap-3">
      <Link
        href="/"
        className="inline-flex size-10 items-center justify-center rounded-xl border border-(--color-border-hi) bg-(--color-card-hi)"
      >
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path
            d="M10 3 5 8l5 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>

      <div className="relative text-center">
        {hasMultiple ? (
          <button
            type="button"
            onClick={() => setSwitcherOpen((prev) => !prev)}
            className="inline-flex items-center gap-1 text-base font-semibold"
          >
            {name}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <h1 className="text-base font-semibold">{name}</h1>
        )}
        <p className="font-mono text-[10px] text-(--color-text3)">{members} amigos · live</p>

        <GroupSwitcher
          groups={groups}
          activeId={activeId}
          open={switcherOpen}
          onClose={() => setSwitcherOpen(false)}
        />
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="inline-flex size-10 items-center justify-center rounded-xl border border-(--color-border-hi) bg-(--color-card-hi)"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
    </header>
  )
}
