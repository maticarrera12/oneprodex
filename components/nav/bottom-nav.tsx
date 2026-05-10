"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  BracketIcon,
  GroupIcon,
  HomeIcon,
  StandingsIcon,
  ProfileIcon,
} from "@/components/icons/tab-icons"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Inicio", Icon: HomeIcon },
  { href: "/standings", label: "Posiciones", Icon: StandingsIcon },
  { href: "/grupo", label: "Grupo", Icon: GroupIcon },
  { href: "/bracket", label: "Bracket", Icon: BracketIcon },
  { href: "/perfil", label: "Perfil", Icon: ProfileIcon },
]

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/"
  }

  return pathname.startsWith(href)
}

export function BottomNav() {
  const pathname = usePathname()
  const activeIndex = Math.max(
    navItems.findIndex((item) => isActive(pathname, item.href)),
    0
  )

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 overflow-x-clip md:hidden" aria-label="Navegacion principal mobile">
      <div className="mx-auto w-full max-w-[640px] px-2 pb-[calc(env(safe-area-inset-bottom)+0.45rem)]">
        <div className="rounded-[28px] border border-border/80 bg-background/70 p-2 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
        <div className="relative grid grid-cols-5">
          <span
            aria-hidden="true"
            className="absolute top-0 h-0.5 w-[12%] rounded-full bg-primary/95 transition-all duration-300 ease-out"
            style={{ left: `calc(${activeIndex} * 20% + 4%)` }}
          />
          {navItems.map(({ href, label, Icon }) => {
            const active = isActive(pathname, href)

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative min-w-0 flex flex-col items-center justify-center gap-1 rounded-2xl py-3 transition-all duration-300",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon
                  className={cn("size-5 transition-transform duration-300", active && "-translate-y-0.5")}
                />
                <span className="font-mono text-[10px] leading-none">{label}</span>
              </Link>
            )
          })}
        </div>
        </div>
      </div>
    </nav>
  )
}
