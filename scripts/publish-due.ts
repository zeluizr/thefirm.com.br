// Processes every item that is ready or whose schedule is due.
// Run by Railway Cron (or manually): npm run publish-due
import { getPool } from '../app/services/db.server'
import { processDueItems } from '../app/services/publisher.server'

async function main() {
  const { processed, results } = await processDueItems()
  console.log(`Processed ${processed} due item(s).`)
  for (const r of results) {
    const summary = r.outcomes.map((o) => `${o.platform}:${o.status}`).join(', ')
    console.log(`  - ${r.slug} → ${r.finalStatus} [${summary || 'no platforms'}]`)
  }
  await getPool().end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
