import Image from "next/image"

function HeaderHexagon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 200"
      className="pointer-events-none absolute left-1/2 top-1/2 size-[88%] -translate-x-1/2 -translate-y-1/2 text-primary/45 drop-shadow-[0_0_32px_var(--color-lime-mid)]"
    >
      <polygon
        points="100,12 178,57 178,143 100,188 22,143 22,57"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      />
    </svg>
  )
}

export function StandingsHeader() {
  return (
    <header className="grid grid-cols-1 items-center gap-4 pb-2 md:grid-cols-[minmax(0,1fr)_220px] md:gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
      <div>
        <h1 className="text-[clamp(2.5rem,7vw,4.5rem)] leading-[0.95] font-extrabold uppercase tracking-[0.01em] text-foreground/90">
          GRUPOS{" "}
          <span className="bg-linear-to-r from-primary via-primary/60 to-black/10 bg-clip-text text-transparent">
            WC 2026
          </span>
        </h1>
        <p className="mt-3 max-w-md text-sm text-muted-foreground">
          Seguí las posiciones de cada grupo en tiempo real
        </p>
      </div>

      <div className="relative mx-auto aspect-square w-full max-w-[220px] md:mx-0 md:max-w-none lg:max-w-[260px]">
        <HeaderHexagon />
        <Image
          src="/world-cup.png"
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 220px, 260px"
          className="pointer-events-none object-contain object-center drop-shadow-[0_0_28px_var(--color-lime-mid)]"
        />
      </div>
    </header>
  )
}
