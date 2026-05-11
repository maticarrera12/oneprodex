'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { signInWithGoogle } from '@/features/auth/api'

function saveNextCookie(next: string) {
  document.cookie = `auth-next=${encodeURIComponent(next)}; path=/; max-age=600; SameSite=Lax`
}

function LoginContent({ next }: { next?: string }) {
  function handleSignIn(fn: (next?: string) => Promise<unknown>) {
    if (next) saveNextCookie(next)
    fn(next)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-[0_6px_24px_rgba(190,242,100,0.35)]">
            <svg width="28" height="28" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 1.5L14 5v6l-6 3.5L2 11V5l6-3.5Z"
                stroke="#0A0A0C"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <circle cx="8" cy="8" r="1.6" fill="#0A0A0C" />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="font-sans text-2xl font-bold tracking-tight text-foreground">
              OneProdex
            </h1>
            <p className="mt-1 font-mono text-sm text-[var(--color-text3)]">
              Viví el Mundial con tus amigos
            </p>
          </div>
        </div>

        {/* Botones */}
        <div className="space-y-3">
          <button
            onClick={() => handleSignIn(signInWithGoogle)}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-[var(--color-border-hi)] bg-[var(--color-card-hi)] px-4 py-3.5 font-sans text-sm font-semibold text-foreground transition-transform active:scale-[0.97]"
          >
            <GoogleIcon />
            Continuar con Google
          </button>

        </div>

        <p className="text-center font-mono text-xs text-[var(--color-text4)]">
          Al continuar aceptás los términos y condiciones
        </p>
      </div>
    </main>
  )
}

function LoginContentWithSearchParams() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? undefined
  return <LoginContent next={next} />
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginContent />}>
      <LoginContentWithSearchParams />
    </Suspense>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  )
}

