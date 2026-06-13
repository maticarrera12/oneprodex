// Backfill match_predictions for matches missing an odds-derived prediction row.
// Targets FINISHED matches by default. The script is idempotent: it skips any
// match already present in match_predictions (ON CONFLICT DO NOTHING).
// Also works for UPCOMING matches — the prematch cron only covers the 48h window,
// so this script is the only way to populate predictions for matches outside that window.
// Usage: pnpm dlx tsx scripts/backfill-predictions.ts
import { fetchOdds } from '@/lib/api-football/client'
import { mapOddsToPrediction } from '@/lib/api-football/mappers'
import { createServiceClient } from '@/lib/supabase/service'

async function main() {
  const supabase = createServiceClient()

  const { data: allMatches, error: matchesError } = await supabase
    .from('matches')
    .select('id,status')
    .in('status', ['FINISHED', 'UPCOMING'])
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
      const { data: oddsData } = await fetchOdds(match.id)
      const bookmakers = oddsData.response[0]?.bookmakers ?? []
      const row = mapOddsToPrediction(match.id, bookmakers)

      if (!row) {
        console.log(`  skip ${match.id} — no valid Match Winner odds from API`)
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
