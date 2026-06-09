import Image from "next/image"
import Link from "next/link"
import { Play } from "lucide-react"

type HomeHeroCardProps = {
  matchday: string
  weekday: string
}

function HeroHexagon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 200"
      className="pointer-events-none absolute right-8 top-1/2 size-52 -translate-y-1/2 text-primary/45 drop-shadow-[0_0_32px_var(--color-lime-mid)] md:right-12 md:size-64"
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

export function HomeHeroCard({ matchday, weekday }: HomeHeroCardProps) {
  return (
    <article className="relative min-h-[340px] overflow-hidden rounded-3xl border border-(--color-border-hi) md:min-h-[360px]">
      <Image
        src="/metlife-stadium.webp"
        alt=""
        fill
        priority
        sizes="(max-width: 768px) 100vw, 66vw"
        className="object-cover object-center opacity-35"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-r from-background/96 via-background/82 to-background/45"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-t from-background/60 via-transparent to-primary/8"
      />

      <div className="relative flex h-full min-h-[340px] flex-col md:min-h-[360px] md:flex-row">
        <div className="flex flex-1 flex-col justify-between p-5 md:p-7">
          <div className="flex items-center gap-3">
            <Image
              src="/oneprodex_fondo.png"
              alt="OneProdex"
              width={44}
              height={44}
              className="shrink-0 rounded-[10px] shadow-[0_6px_20px_rgba(190,242,100,0.35)]"
            />
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                {matchday.toUpperCase()}
              </p>
              <p className="text-sm font-semibold text-foreground">{weekday}</p>
            </div>
          </div>

          <div className="mt-8 max-w-md space-y-4 md:mt-0">
            <h1 className="text-[clamp(1.75rem,4vw,2.35rem)] leading-[1.05] font-bold tracking-[-0.03em]">
              Your World Cup,{" "}
              <span className="text-primary">live.</span>
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Seguí todos los partidos en vivo y sumá puntos.
            </p>
            <Link
              href="/partidos"
              className="inline-flex items-center gap-2.5 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_8px_28px_rgba(190,242,100,0.35)] transition-transform active:scale-[0.98]"
            >
              <Play className="size-4 fill-primary-foreground" />
              Ver todos los partidos
            </Link>
          </div>
        </div>

        <div className="relative h-48 shrink-0 md:h-auto md:w-[42%] md:min-w-[240px]">
          <HeroHexagon />
          <Image
            src="/world-cup.png"
            alt="Copa del Mundo FIFA"
            width={420}
            height={420}
            priority
            className="pointer-events-none absolute bottom-0 right-0 h-[88%] w-auto max-w-none object-contain object-bottom drop-shadow-[0_12px_40px_rgba(0,0,0,0.55)] md:h-[92%]"
          />
          <p
            aria-hidden="true"
            className="font-display pointer-events-none absolute bottom-3 right-3 text-[clamp(4.5rem,12vw,7.5rem)] leading-none tracking-[0.04em] text-year-outline md:bottom-5 md:right-5"
          >
            2026
          </p>
        </div>
      </div>
    </article>
  )
}
