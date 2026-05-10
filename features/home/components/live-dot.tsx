"use client"

import { motion } from "framer-motion"

export function LiveDot() {
  return (
    <span className="relative inline-flex size-2.5 items-center justify-center">
      <motion.span
        aria-hidden="true"
        className="absolute inset-0 rounded-full bg-primary/65"
        animate={{ scale: [1, 1.8, 1], opacity: [1, 0.3, 0] }}
        transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeOut" }}
      />
      <span className="size-2 rounded-full bg-primary shadow-[0_0_12px_var(--color-lime-mid)]" />
    </span>
  )
}
