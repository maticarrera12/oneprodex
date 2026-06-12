// Backfill match_predictions for all matches (FINISHED + UPCOMING) missing a prediction row.
// Tolerant: skips matches where the API returns no prediction (null mapPrediction result).
// Usage: pnpm dlx tsx scripts/backfill-predictions.ts
import { fetchPredictions } from '@/lib/api-football/client'
import { mapPrediction } from '@/lib/api-football/mappers'
import { createServiceClient } from '@/lib/supabase/service'

async function main() {
  const supabase = createServiceClient()

  // Fetch all matches that are missing from match_predictions
  const { data: allMatches, error: matchesError } = await supabase
    .from('matches')
    .select('id,status')
    .order('kickoff', { ascending: true })

  if (matchesError) {
    console.error('Failed to fetch matches:', matchesError.message)
    process.exit(1)
  }

  const matches = allMatches ?? []

  // Fetch IDs already in match_predictions
  const { data: storedRows, error: storedError } = await supabase
    .from('match_predictions')
    .select('match_id')

  if (storedError) {
    console.error('Failed to fetch stored predictions:', storedError.message)
    process.exit(1)
  }

  const storedIds = new Set((storedRows ?? []).map((r) => r.match_id))
  const missing = matches.filter((m) => !storedIds.has(m.id))

  console.log(`Found ${missing.length} matches missing predictions (out of ${matches.length} total)`)

  let inserted = 0
  let skipped = 0
  let failed = 0

  for (const match of missing) {
    try {
      const { data: predData } = await fetchPredictions(match.id)
      const item = predData.response[0] ?? null
      const row = mapPrediction(match.id, item)

      if (!row) {
        console.log(`  skip ${match.id} — no prediction from API`)
        skipped++
        continue
      }

      // ignoreDuplicates = ON CONFLICT DO NOTHING — snapshots are immutable
      const { error: writeError } = await supabase
        .from('match_predictions')
        .upsert([row], { onConflict: 'match_id', ignoreDuplicates: true })

      if (writeError) {
        console.warn(`  warn ${match.id} — write error: ${writeError.message}`)
        failed++
      } else {
        console.log(`  ok   ${match.id} (home=${row.home_pct}% draw=${row.draw_pct}% away=${row.away_pct}%)`)
        inserted++
      }
    } catch (err) {
      console.warn(`  skip ${match.id} — API error: ${err instanceof Error ? err.message : String(err)}`)
      skipped++
    }
  }

  console.log(`\nDone. inserted=${inserted} skipped=${skipped} failed=${failed}`)

  if (failed > 0) {
    process.exit(1)
  }
}

main().catch((cause) => {
  console.error(cause)
  process.exit(1)
})
