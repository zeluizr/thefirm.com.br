// acesso tipado às variáveis de BOOTSTRAP (necessárias antes do login, logo
// só env). chaves OPERACIONAIS (Gemini, Telegram, cron) vêm do banco via config.ts —
// não acesse process.env pra elas direto, use runtimeConfig().

function optional(name: string, fallback = ''): string {
  return process.env[name] ?? fallback
}

export function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`env ausente: ${name}`)
  return v
}

// APP_URL: explícito > domínio público do Railway > localhost
function resolveAppUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL
  const railway = process.env.RAILWAY_PUBLIC_DOMAIN
  if (railway) return `https://${railway}`
  return 'http://localhost:3000'
}

export const env = {
  get DATABASE_URL() {
    return requireEnv('DATABASE_URL')
  },
  APP_URL: resolveAppUrl(),

  // armazenamento de mídia (monte um Railway Volume em MEDIA_DIR no web service)
  MEDIA_DIR: optional('MEDIA_DIR', 'data/uploads'),
  MEDIA_PUBLIC_PATH: optional('MEDIA_PUBLIC_PATH', '/uploads'),

  // chave mestra que cifra os settings operacionais no banco.
  // BOOTSTRAP: precisa estar no env (não dá pra guardar a chave dentro do que ela cifra).
  CONFIG_ENCRYPTION_KEY: optional('CONFIG_ENCRYPTION_KEY'),

  // auth do admin (OAuth Google — distinto da GEMINI_API_KEY operacional)
  ADMIN_EMAIL: optional('ADMIN_EMAIL'),
  BETTER_AUTH_SECRET: optional('BETTER_AUTH_SECRET'),
  BETTER_AUTH_URL: optional('BETTER_AUTH_URL', resolveAppUrl()),
  GOOGLE_CLIENT_ID: optional('GOOGLE_CLIENT_ID'),
  GOOGLE_CLIENT_SECRET: optional('GOOGLE_CLIENT_SECRET'),
}

export const isProd = process.env.NODE_ENV === 'production'
