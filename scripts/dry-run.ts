// Simulates publishing for every due item WITHOUT persisting anything.
// Useful to preview what the cron would do. Usage: npm run dry-run
import { getPool } from '../app/services/db.server'
import { processDueItems } from '../app/services/publisher.server'

async function main() {
  const { processed, results } = await processDueItems({ dryRun: true })
  console.log(`[DRY-RUN] Would process ${processed} due item(s).`)
  for (const r of results) {
    console.log(`  - ${r.slug}`)
    for (const o of r.outcomes) {
      console.log(`      ${o.platform}: ${o.status}${o.permalink ? ` → ${o.permalink}` : ''}${o.error ? ` (${o.error})` : ''}`)
    }
  }
  await getPool().end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
