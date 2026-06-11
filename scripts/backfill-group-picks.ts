// One-off repair: re-derive group_picks for prode users whose rows were
// corrupted by the matchday→group stage parsing bug. Safe to re-run.
// Usage: pnpm dlx tsx scripts/backfill-group-picks.ts <user_id> [...user_id]
import { deriveAndPersistGroupRankings } from "@/features/onboarding/actions"

async function main() {
  const userIds = process.argv.slice(2)
  if (userIds.length === 0) {
    console.error("Usage: tsx scripts/backfill-group-picks.ts <user_id> [...user_id]")
    process.exit(1)
  }

  for (const userId of userIds) {
    await deriveAndPersistGroupRankings(userId)
    console.log(`re-derived group_picks for ${userId}`)
  }
}

main().catch((cause) => {
  console.error(cause)
  process.exit(1)
})
