"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Inicio" },
  { href: "/standings", label: "Posiciones" },
  { href: "/grupo", label: "Grupo" },
  { href: "/bracket", label: "Bracket" },
  { href: "/perfil", label: "Perfil" },
]

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/"
  }

  return pathname.startsWith(href)
}

export function TopNav() {
  const pathname = usePathname()

  return (
    <nav
      className="sticky top-0 z-50 hidden border-b border-border/80 bg-background/80 backdrop-blur-xl md:flex"
      aria-label="Navegacion principal desktop"
    >
      <div className="mx-auto flex w-full max-w-[1080px] items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2">
          <svg
            viewBox="0 0 24 24"
            className="size-5 fill-primary"
            aria-hidden="true"
          >
            <path d="M6 3h12l6 9-6 9H6L0 12z" />
          </svg>
          <span className="font-semibold tracking-wide">OneProdex</span>
        </div>

        <div className="flex items-center gap-6">
          {navItems.map(({ href, label }) => {
            const active = isActive(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative pb-3 text-sm text-muted-foreground transition-all duration-300 hover:text-foreground",
                  active && "font-semibold text-primary"
                )}
              >
                {label}
                {active ? (
                  <motion.span
                    layoutId="desktop-nav-indicator"
                    aria-hidden="true"
                    className="absolute bottom-[-2px] left-1/2 h-px w-8 -translate-x-1/2 rounded-full bg-primary/95"
                    transition={{ type: "spring", stiffness: 520, damping: 40, mass: 0.45 }}
                  />
                ) : null}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
