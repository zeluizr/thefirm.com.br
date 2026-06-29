import type { Route } from './+types/api.cron.publish-due'

import { env } from '~/services/env.server'
import { processDueItems } from '~/services/publisher.server'

function authorized(request: Request): boolean {
  if (!env.CRON_SECRET) return true // open when no secret configured (local/internal)
  const provided =
    request.headers.get('x-cron-secret') ??
    new URL(request.url).searchParams.get('secret')
  return provided === env.CRON_SECRET
}

// POST /api/cron/publish-due — processes every due item.
export async function action({ request }: Route.ActionArgs) {
  if (!authorized(request)) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  const result = await processDueItems()
  return Response.json({ ok: true, processed: result.processed })
}

// GET — info, or run the queue if a valid ?secret is supplied (for HTTP cron
// services that only issue GET requests).
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url)
  if (url.searchParams.has('secret')) {
    if (!authorized(request)) {
      return Response.json({ error: 'unauthorized' }, { status: 401 })
    }
    const result = await processDueItems()
    return Response.json({ ok: true, processed: result.processed })
  }
  return Response.json({
    ok: true,
    hint: 'POST here (or GET with ?secret=) to process due publications.',
  })
}
