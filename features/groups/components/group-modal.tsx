'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { createGroup, deleteGroup, leaveGroup } from '@/features/groups/actions'

type Tab = 'create' | 'join' | 'manage'

type GroupModalProps = {
  open: boolean
  onClose: () => void
  defaultTab?: 'create' | 'join'
  groupId?: string
  isOwner?: boolean
  showTabs?: boolean
}

const spring = { type: 'spring' as const, damping: 30, stiffness: 300 }

export function GroupModal({ open, onClose, defaultTab = 'create', groupId, isOwner, showTabs = true }: GroupModalProps) {
  const [tab, setTab] = useState<Tab>(defaultTab)
  const [preview, setPreview] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPreview(URL.createObjectURL(file))
  }

  function handleClose() {
    setConfirming(false)
    onClose()
  }

  const hasManage = Boolean(groupId)

  useEffect(() => {
    if (!open) return
    setTab(defaultTab)
    setConfirming(false)
  }, [defaultTab, open])

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
            onClick={handleClose}
          />
          <motion.div
            key="sheet"
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={spring}
            onClick={handleClose}
          >
            <div
              className="flex max-h-[86dvh] w-full max-w-md flex-col rounded-3xl bg-background px-4 pb-4 pt-4"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-(--color-border-hi)" />

              {showTabs ? (
                <div className={`mb-6 flex gap-2 rounded-xl border border-(--color-border-hi) bg-(--color-card-hi) p-1`}>
                  <button
                    type="button"
                    onClick={() => { setTab('create'); setConfirming(false) }}
                    className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
                      tab === 'create' ? 'bg-primary text-primary-foreground' : 'text-(--color-text3)'
                    }`}
                  >
                    Crear grupo
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTab('join'); setConfirming(false) }}
                    className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
                      tab === 'join' ? 'bg-primary text-primary-foreground' : 'text-(--color-text3)'
                    }`}
                  >
                    Unirme
                  </button>
                  {hasManage ? (
                    <button
                      type="button"
                      onClick={() => { setTab('manage'); setConfirming(false) }}
                      className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
                        tab === 'manage' ? 'bg-primary text-primary-foreground' : 'text-(--color-text3)'
                      }`}
                    >
                      Gestionar
                    </button>
                  ) : null}
                </div>
              ) : (
                <div className="mb-6 text-center">
                  <p className="text-base font-semibold text-foreground">
                    {tab === 'create' ? 'Crear grupo' : 'Unirme a un grupo'}
                  </p>
                  <p className="mt-1 text-xs text-(--color-text3)">
                    {tab === 'create'
                      ? 'Personalizá tu grupo y compartí la invitación.'
                      : 'Pegá el código que te compartieron para entrar.'}
                  </p>
                </div>
              )}

              <div className="min-h-[340px] overflow-y-auto pb-6">
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
                ) : tab === 'join' ? (
                  <form action="/unirse" method="get" className="space-y-3 pt-10">
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
                      Continuar
                    </button>
                  </form>
                ) : (
                  <div className="space-y-3 pt-10">
                    {confirming ? (
                      <div className="rounded-2xl border border-red-500/30 bg-red-500/8 p-4 space-y-3">
                        <p className="text-sm font-semibold text-foreground text-center">
                          {isOwner ? '¿Eliminar el grupo?' : '¿Salir del grupo?'}
                        </p>
                        <p className="text-xs text-(--color-text3) text-center leading-relaxed">
                          {isOwner
                            ? 'Se eliminará el grupo y todos los miembros perderán el acceso. Esta acción no se puede deshacer.'
                            : 'Vas a salir del grupo. Podés volver a unirte con el código de invitación.'}
                        </p>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setConfirming(false)}
                            className="rounded-xl border border-(--color-border-hi) py-3 text-sm font-semibold text-foreground"
                          >
                            Cancelar
                          </button>
                          <form action={isOwner ? deleteGroup.bind(null, groupId!) : leaveGroup.bind(null, groupId!)}>
                            <button
                              type="submit"
                              className="w-full rounded-xl bg-red-500 py-3 text-sm font-semibold text-white"
                            >
                              {isOwner ? 'Eliminar' : 'Salir'}
                            </button>
                          </form>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirming(true)}
                        className="w-full rounded-xl border border-red-500/30 bg-red-500/8 py-3 text-sm font-semibold text-red-400"
                      >
                        {isOwner ? 'Eliminar grupo' : 'Salir del grupo'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}
