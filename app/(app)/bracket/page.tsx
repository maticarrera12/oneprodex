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
    return <EmptyState message="Todavía no hay picks de bracket guardados" />
  }

  return (
    <BracketScreen rounds={data.rounds} scoreStats={data.scoreStats} champion={data.champion} readOnly={data.readOnly} />
  )
}
