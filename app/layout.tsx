import { Bebas_Neue, Geist, Geist_Mono } from "next/font/google"
import type { Metadata, Viewport } from "next"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "OneProdex",
  description: "Predicciones, grupos y puntos del Mundial 2026 — en vivo.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "OneProdex",
    description: "Predicciones, grupos y puntos del Mundial 2026 — en vivo.",
    siteName: "OneProdex",
    locale: "es_AR",
    type: "website",
    images: [{ url: "/oneprodex.png", width: 512, height: 512, alt: "OneProdex" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "OneProdex",
    description: "Predicciones, grupos y puntos del Mundial 2026 — en vivo.",
    images: ["/oneprodex.png"],
  },
}

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const fontDisplay = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, fontSans.variable, fontDisplay.variable)}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
