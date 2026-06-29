import { webhookCallback } from 'grammy'

import { runtimeConfig } from '@server/lib/config'
import { ensureBotReady } from '@server/telegram/bot'
import type { Route } from './+types/api.webhooks.telegram'

// webhook do Telegram. valida o secret token e delega ao grammY.
export async function action({ request }: Route.ActionArgs) {
  const bot = await ensureBotReady()
  const { telegramWebhookSecret } = await runtimeConfig()
  const handle = webhookCallback(bot, 'std/http', {
    secretToken: telegramWebhookSecret || undefined,
  })
  return handle(request)
}

// GET não é usado pelo Telegram — responde 405
export function loader() {
  return new Response('method not allowed', { status: 405 })
}
