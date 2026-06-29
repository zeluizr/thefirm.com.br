import { runDailyPost } from '../pipeline/run'

// entrypoint do Railway Cron (serviço separado do web). roda 1x/dia.
// schedule sugerido: 0 12 * * *  (≈ 09:00 Santiago)
async function main(): Promise<void> {
  console.log(`[cron] início ${new Date().toISOString()}`)
  const result = await runDailyPost()
  console.log('[cron] fim:', JSON.stringify(result))
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('[cron] erro fatal:', e)
    process.exit(1)
  })
