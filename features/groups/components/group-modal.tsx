'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { createGroup, joinGroup } from '@/features/groups/actions'

type Tab = 'create' | 'join'

type GroupModalProps = {
  open: boolean
  onClose: () => void
  defaultTab?: Tab
}

const spring = { type: 'spring' as const, damping: 30, stiffness: 300 }

export function GroupModal({ open, onClose, defaultTab = 'create' }: GroupModalProps) {
  const [tab, setTab] = useState<Tab>(defaultTab)
  const [preview, setPreview] = useState<string | null>(null)

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPreview(URL.createObjectURL(file))
  }

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={spring}
            onClick={onClose}
          >
            <div
              className="w-full max-w-md rounded-3xl bg-background px-4 pb-10 pt-4"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-(--color-border-hi)" />

              <div className="mb-6 flex gap-2 rounded-xl border border-(--color-border-hi) bg-(--color-card-hi) p-1">
                <button
                  type="button"
                  onClick={() => setTab('create')}
                  className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
                    tab === 'create' ? 'bg-primary text-primary-foreground' : 'text-(--color-text3)'
                  }`}
                >
                  Crear grupo
                </button>
                <button
                  type="button"
                  onClick={() => setTab('join')}
                  className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
                    tab === 'join' ? 'bg-primary text-primary-foreground' : 'text-(--color-text3)'
                  }`}
                >
                  Unirme
                </button>
              </div>

              {tab === 'create' ? (
                <form action={createGroup} encType="multipart/form-data" className="space-y-3">
                  <div className="flex justify-center">
                    <label
                      htmlFor="group-image"
                      className="flex size-24 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-(--color-border-hi) bg-(--color-card-hi) overflow-hidden"
                    >
                      {preview ? (
                        <img src={preview} alt="Vista previa" className="size-full object-cover rounded-full" />
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-(--color-text3)">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.5"/>
                          <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                      )}
                    </label>
                    <input
                      type="file"
                      id="group-image"
                      name="image"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleImageChange}
                    />
                  </div>
                  <input
                    name="name"
                    type="text"
                    placeholder="Nombre del grupo"
                    required
                    className="w-full rounded-xl border border-(--color-border-hi) bg-(--color-card-hi) px-4 py-3 text-sm text-foreground placeholder:text-(--color-text3) focus:outline-none"
                  />
                  <textarea
                    name="description"
                    placeholder="Descripción (opcional)"
                    rows={2}
                    className="w-full rounded-xl border border-(--color-border-hi) bg-(--color-card-hi) px-4 py-3 text-sm text-foreground placeholder:text-(--color-text3) focus:outline-none resize-none"
                  />
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
                  >
                    Crear grupo
                  </button>
                </form>
              ) : (
                <form action={joinGroup} className="space-y-3">
                  <input
                    name="code"
                    type="text"
                    placeholder="Código de invitación"
                    required
                    className="w-full rounded-xl border border-(--color-border-hi) bg-(--color-card-hi) px-4 py-3 text-sm uppercase tracking-widest text-foreground placeholder:text-(--color-text3) focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
                  >
                    Unirme al grupo
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}
