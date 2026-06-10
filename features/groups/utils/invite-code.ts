export function normalizeInviteCode(value: string | null | undefined): string {
  const raw = value?.trim() ?? ""
  if (!raw) return ""

  try {
    const url = new URL(raw)
    const code = url.searchParams.get("code")
    if (code) return code.trim().toUpperCase()
  } catch {
    // Not a URL; treat it as the raw invite code.
  }

  return raw.toUpperCase()
}
