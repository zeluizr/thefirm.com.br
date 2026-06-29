import { runtimeConfig } from '@server/lib/config'
import { runDailyPost } from '@server/pipeline/run'
import type { Route } from './+types/api.cron.daily'

// dispara o pipeline do dia rodando DENTRO do web service (escreve a mídia no
// volume do web). Railway Cron chama: curl -XPOST -H "x-cron-secret: $CRON_SECRET" $APP_URL/api/cron/daily
export async function action({ request }: Route.ActionArgs) {
  const secret = request.headers.get('x-cron-secret')
  const { cronSecret } = await runtimeConfig()
  if (!cronSecret || secret !== cronSecret) {
    return new Response('unauthorized', { status: 401 })
  }
  const result = await runDailyPost()
  return Response.json(result)
}

export function loader() {
  return new Response('method not allowed', { status: 405 })
}
