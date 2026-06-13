'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { GroupSwitcher } from '@/features/groups/components/group-switcher'
import { ShareBrandIcon } from '@/features/shared/components/share-brand-icon'
import type { GroupInfo } from '@/features/groups/types'

type GroupHeaderProps = {
  name: string
  members: number
  inviteCode: string
  onAdd: () => void
  groups?: GroupInfo[]
  activeId?: string
}

export function GroupHeader({ name, members, inviteCode, onAdd, groups = [], activeId = '' }: GroupHeaderProps) {
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const hasMultiple = groups.length > 1
  const shareBase =
    typeof window !== 'undefined' ? `${window.location.origin}/unirse?code=${encodeURIComponent(inviteCode)}` : ''
  const shareText = `Sumate a mi grupo "${name}" en OneProdex`
  const shareMessage = `${shareText} ${shareBase}`
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`
  const facebookHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareBase)}&quote=${encodeURIComponent(shareText)}`
  const xHref = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareBase)}`

  function closeShare() {
    setShareOpen(false)
  }

  function triggerShareAchievement() {
    fetch('/api/achievements/share-group', { method: 'POST' }).catch(() => {})
  }

  async function copyInviteLink() {
    if (typeof window !== 'undefined' && window.navigator?.clipboard?.writeText) {
      await window.navigator.clipboard.writeText(shareBase)
      triggerShareAchievement()
      setToastMessage('Link copiado')
    }
  }

  async function shareNatively() {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: 'OneProdex',
          text: shareText,
          url: shareBase,
        })
        triggerShareAchievement()
        setToastMessage('Compartido')
        closeShare()
      } catch {
        return
      }
    }
  }

  async function shareToInstagram() {
    try {
      if (typeof navigator !== 'undefined' && 'share' in navigator) {
        await navigator.share({
          title: 'OneProdex',
          text: shareText,
          url: shareBase,
        })
        triggerShareAchievement()
        closeShare()
        return
      }
    } catch {
      return
    }

    if (typeof window !== 'undefined' && window.navigator?.clipboard?.writeText) {
      await window.navigator.clipboard.writeText(shareMessage)
      triggerShareAchievement()
      setToastMessage('Texto copiado para Instagram')
    }

    window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer')
  }

  useEffect(() => {
    if (!toastMessage) return
    const timeout = window.setTimeout(() => setToastMessage(''), 1800)
    return () => window.clearTimeout(timeout)
  }, [toastMessage])

  return (
    <header className={`relative grid grid-cols-[40px_1fr_auto] items-center gap-3 ${shareOpen ? 'z-50' : 'z-40'}`}>
      {shareOpen ? (
        <button type="button" aria-label="Cerrar compartir" className="fixed inset-0 z-40 bg-black/20" onClick={closeShare} />
      ) : null}
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

      <div className="relative z-50 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShareOpen((prev) => !prev)}
          className="inline-flex size-10 items-center justify-center rounded-xl border border-(--color-border-hi) bg-(--color-card-hi)"
          aria-label="Compartir invitación"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M11 5a2 2 0 1 0-1.94-2.5l-3.6 1.8a2 2 0 1 0 0 3.4l3.6 1.8A2 2 0 1 0 9.5 8l-3.6-1.8a2 2 0 0 0 0-.4L9.5 4a2 2 0 0 0 1.5 1Z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex size-10 items-center justify-center rounded-xl border border-(--color-border-hi) bg-(--color-card-hi)"
          aria-label="Crear o unirme a grupo"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>

        <AnimatePresence>
          {shareOpen ? (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute right-0 top-12 z-50 w-[320px] rounded-2xl border border-(--color-border-hi) bg-background p-3 shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Compartir invitación</p>
                <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] text-primary">{inviteCode}</span>
              </div>

              <div className="mb-3 rounded-xl border border-(--color-border-hi) bg-(--color-card-hi) p-3">
                <p className="text-xs font-semibold text-foreground">{name}</p>
                <p className="mt-1 line-clamp-2 text-xs text-(--color-text2)">{shareText}</p>
                <p className="mt-1 truncate font-mono text-[11px] text-(--color-text3)">{shareBase}</p>
              </div>

              <div className="mb-2 grid grid-cols-2 gap-2">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-(--color-border-hi) bg-(--color-card-hi) px-3 py-2 text-left text-xs font-semibold text-foreground hover:bg-black/20"
                  onClick={() => { triggerShareAchievement(); closeShare() }}
                >
                  <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white">
                    <ShareBrandIcon brand="whatsapp" className="size-3" />
                  </span>
                  WhatsApp
                </a>
                <a
                  href={facebookHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-(--color-border-hi) bg-(--color-card-hi) px-3 py-2 text-left text-xs font-semibold text-foreground hover:bg-black/20"
                  onClick={() => { triggerShareAchievement(); closeShare() }}
                >
                  <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#1877F2] text-white">
                    <ShareBrandIcon brand="facebook" className="size-3" />
                  </span>
                  Facebook
                </a>
                <a
                  href={xHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-(--color-border-hi) bg-(--color-card-hi) px-3 py-2 text-left text-xs font-semibold text-foreground hover:bg-black/20"
                  onClick={() => { triggerShareAchievement(); closeShare() }}
                >
                  <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-black text-white">
                    <ShareBrandIcon brand="x" className="size-2.5" />
                  </span>
                  X
                </a>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-lg border border-(--color-border-hi) bg-(--color-card-hi) px-3 py-2 text-left text-xs font-semibold text-foreground hover:bg-black/20"
                  onClick={shareToInstagram}
                >
                  <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#E4405F] text-white">
                    <ShareBrandIcon brand="instagram" className="size-3" />
                  </span>
                  Instagram
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                  onClick={copyInviteLink}
                >
                  Copiar link
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-(--color-border-hi) bg-(--color-card-hi) px-3 py-2 text-xs font-semibold text-foreground"
                  onClick={shareNatively}
                >
                  Compartir
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {toastMessage ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="pointer-events-none fixed bottom-5 left-1/2 z-40 -translate-x-1/2 rounded-full border border-primary/35 bg-background px-4 py-2 text-xs font-semibold text-primary shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
          >
            {toastMessage}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  )
}
