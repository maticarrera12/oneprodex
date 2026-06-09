"use client"

import { useState } from "react"
import { Flag } from "@/features/home/components/flag"

type TeamLogoProps = {
  code: string
  logo?: string | null
  size?: number
  className?: string
}

export function TeamLogo({ code, logo, size = 24, className = "" }: TeamLogoProps) {
  const [failed, setFailed] = useState(false)

  if (logo && !failed) {
    return (
      <img
        src={logo}
        alt={code}
        width={size}
        height={size}
        className={`shrink-0 rounded-full border border-white/20 object-cover ${className}`}
        style={{ width: size, height: size }}
        onError={() => setFailed(true)}
      />
    )
  }

  return <Flag code={code} size={size} />
}
