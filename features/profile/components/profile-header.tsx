import Link from "next/link"

export function ProfileHeader() {
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
      <h1 className="text-center text-base font-semibold">Profile</h1>
      <button
        type="button"
        className="inline-flex size-10 items-center justify-center rounded-xl border border-(--color-border-hi) bg-(--color-card-hi)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M10.2 4.2a1 1 0 0 1 1.6 0l.7 1a1 1 0 0 0 1 .4l1.2-.2a1 1 0 0 1 1.2 1l.1 1.2a1 1 0 0 0 .6.9l1.1.5a1 1 0 0 1 .4 1.5l-.7 1a1 1 0 0 0 0 1.1l.7 1a1 1 0 0 1-.4 1.5l-1.1.5a1 1 0 0 0-.6.9l-.1 1.2a1 1 0 0 1-1.2 1l-1.2-.2a1 1 0 0 0-1 .4l-.7 1a1 1 0 0 1-1.6 0l-.7-1a1 1 0 0 0-1-.4l-1.2.2a1 1 0 0 1-1.2-1l-.1-1.2a1 1 0 0 0-.6-.9l-1.1-.5a1 1 0 0 1-.4-1.5l.7-1a1 1 0 0 0 0-1.1l-.7-1a1 1 0 0 1 .4-1.5l1.1-.5a1 1 0 0 0 .6-.9l.1-1.2a1 1 0 0 1 1.2-1l1.2.2a1 1 0 0 0 1-.4l.7-1Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </button>
    </header>
  )
}
