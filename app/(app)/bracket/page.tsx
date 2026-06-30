import Link from "next/link"
import { BracketScreen } from "@/features/bracket/components/bracket-screen"
import { getBracketData } from "@/features/bracket/api"
import { EmptyState } from "@/features/shared/components/empty-state"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

export default async function BracketPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <EmptyState message="Iniciá sesión para ver tu bracket" />
  }

  const service = createServiceClient()
  const data = await getBracketData(service, user.id)

  if (!data) {
    return (
      <div className="py-8 text-center">
        <p className="mb-3 text-sm text-(--color-text3)">Todavía no armaste tu bracket</p>
        <Link
          href="/onboarding"
          className="inline-block rounded-full border border-(--color-border-hi) px-4 py-2 text-sm font-medium text-(--color-text2) transition-colors hover:bg-(--color-card-hi)"
        >
          Armá tu bracket
        </Link>
      </div>
    )
  }

  return (
    <BracketScreen
      rounds={data.rounds}
      actualRounds={data.actualRounds}
      scoreStats={data.scoreStats}
      champion={data.champion}
      readOnly={data.readOnly}
      allowScorePicks
      userScores={Object.fromEntries(data.userKspByMatchId)}
    />
  )
}
