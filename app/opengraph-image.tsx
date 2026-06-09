import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "OneProdex — Tu Mundial 2026"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          background: "#0a0a0a",
          padding: "72px 80px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Lime glow top-left */}
        <div
          style={{
            position: "absolute",
            top: -120,
            left: -80,
            width: 560,
            height: 560,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(190,242,100,0.18) 0%, transparent 70%)",
          }}
        />

        {/* Grid lines */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* WC badge top-right */}
        <div
          style={{
            position: "absolute",
            top: 64,
            right: 80,
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "rgba(190,242,100,0.10)",
            border: "1px solid rgba(190,242,100,0.25)",
            borderRadius: 12,
            padding: "10px 20px",
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#bef264",
            }}
          />
          <span style={{ color: "#bef264", fontSize: 15, fontWeight: 700, letterSpacing: "0.12em" }}>
            MUNDIAL 2026
          </span>
        </div>

        {/* Logo mark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 64,
            height: 64,
            borderRadius: 16,
            background: "linear-gradient(135deg, #bef264, #84cc16)",
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              background: "#0a0a0a",
              borderRadius: 7,
              transform: "rotate(45deg)",
            }}
          />
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#f5f5f5",
            lineHeight: 1,
            letterSpacing: "-0.03em",
            marginBottom: 20,
          }}
        >
          OneProdex
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 28,
            color: "rgba(255,255,255,0.45)",
            fontWeight: 400,
            letterSpacing: "0.01em",
          }}
        >
          Predicciones, grupos y puntos — en vivo.
        </div>
      </div>
    ),
    { ...size },
  )
}
