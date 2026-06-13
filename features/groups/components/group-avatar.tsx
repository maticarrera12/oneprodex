"use client"

import { useState } from "react"

type GroupAvatarProps = {
  name: string
  color: string
  size: number
  ring?: boolean
  imageUrl?: string | null
}

export function GroupAvatar({ name, color, size, ring = false, imageUrl }: GroupAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const initial = name.slice(0, 1).toUpperCase()
  const showImage = Boolean(imageUrl) && !imageFailed

  const ringStyle = ring
    ? "0 0 0 2px var(--color-bg2), 0 0 0 3.5px var(--color-lime-mid), 0 6px 16px rgba(163,230,53,0.25)"
    : "inset 0 0 0 1px rgba(255,255,255,0.08)"

  if (showImage) {
    return (
      <span
        className="inline-flex shrink-0 overflow-hidden rounded-full"
        style={{
          width: size,
          height: size,
          boxShadow: ringStyle,
        }}
      >
        <img
          src={imageUrl!}
          alt={name}
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
          className="size-full object-cover"
        />
      </span>
    )
  }

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-black"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${color} 0%, ${shade(color, -24)} 100%)`,
        boxShadow: ringStyle,
        fontSize: size * 0.4,
      }}
    >
      {initial}
    </span>
  )
}

function shade(hex: string, pct: number): string {
  const parsed = hex.replace("#", "").match(/.{2}/g)
  if (!parsed) return hex
  const [r, g, b] = parsed.map((part) => Number.parseInt(part, 16))
  const factor = pct / 100
  const clamp = (channel: number) => Math.max(0, Math.min(255, Math.round(channel + channel * factor)))
  return `#${[clamp(r), clamp(g), clamp(b)].map((value) => value.toString(16).padStart(2, "0")).join("")}`
}
