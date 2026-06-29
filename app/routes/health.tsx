import { query } from '~/services/db.server'
import { env } from '~/services/env.server'

// GET /health — liveness + DB connectivity probe for Railway.
export async function loader() {
  let db: 'ok' | 'error' = 'ok'
  try {
    await query('select 1')
  } catch {
    db = 'error'
  }
  return Response.json(
    {
      status: db === 'ok' ? 'ok' : 'degraded',
      db,
      dryRun: env.DRY_RUN,
      time: new Date().toISOString(),
    },
    { status: db === 'ok' ? 200 : 503 },
  )
}
