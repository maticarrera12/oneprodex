"use client"

import type { getBracketData } from "@/features/bracket/api"
import { BracketScreen } from "@/features/bracket/components/bracket-screen"

type BracketData = NonNullable<Awaited<ReturnType<typeof getBracketData>>>

type FriendBracketTabProps = {
  data: BracketData | null
}

export function FriendBracketTab({ data }: FriendBracketTabProps) {
  if (!data) {
    return (
      <p className="py-8 text-center text-sm text-(--color-text3)">
        Aún no completó su bracket
      </p>
    )
  }

  return (
    <BracketScreen
      rounds={data.rounds}
      actualRounds={data.actualRounds}
      scoreStats={data.scoreStats}
      champion={data.champion}
      readOnly={true}
    />
  )
}
