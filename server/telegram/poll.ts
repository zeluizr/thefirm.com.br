import { getBot } from './bot'

// modo dev: long polling. recebe os toques dos botões inline SEM precisar de uma
// URL pública pro webhook — ideal pra testar aprovação/rejeição no localhost.
// rode num terminal à parte:  pnpm bot:dev
// (em produção use o webhook /api/webhooks/telegram, não o polling)
async function main(): Promise<void> {
  const bot = await getBot()
  // webhook e polling são mutuamente exclusivos — limpa o webhook e descarta
  // updates pendentes (toques velhos da fila, que dariam 'query is too old')
  await bot.api.deleteWebhook({ drop_pending_updates: true })
  await bot.start({
    drop_pending_updates: true,
    onStart: (me) => console.log(`[bot:dev] @${me.username} ouvindo (ctrl+c pra sair)`),
  })
}

main().catch((e) => {
  console.error('[bot:dev] erro:', e)
  process.exit(1)
})
