import { BOOTSTRAP_SPEC, SETTINGS_SPEC, type SettingField } from './config-spec'
import { decrypt, encrypt, encryptionAvailable } from './crypto'
import { db } from './db'

// resolução de config operacional: banco (decifrado) tem prioridade sobre o env.
// cache em memória, invalidado a cada escrita.

let cache: Map<string, string> | null = null

async function loadDb(): Promise<Map<string, string>> {
  if (cache) return cache
  const m = new Map<string, string>()
  if (encryptionAvailable()) {
    const rows = await db.setting.findMany()
    for (const r of rows) {
      try {
        m.set(r.key, decrypt(r.value))
      } catch {
        // valor cifrado com outra chave — ignora (cai pro env)
      }
    }
  }
  cache = m
  return m
}

export function invalidateConfigCache(): void {
  cache = null
}

async function resolver(): Promise<(key: string, fallback?: string) => string> {
  const m = await loadDb()
  return (key, fallback = '') => m.get(key) || process.env[key] || fallback
}

export async function getSetting(key: string, fallback = ''): Promise<string> {
  return (await resolver())(key, fallback)
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.setting.upsert({
    where: { key },
    update: { value: encrypt(value) },
    create: { key, value: encrypt(value) },
  })
  invalidateConfigCache()
}

export async function deleteSetting(key: string): Promise<void> {
  await db.setting.deleteMany({ where: { key } })
  invalidateConfigCache()
}

// fonte de cada chave (pra UI mostrar de onde veio o valor)
export type Source = 'db' | 'env' | 'none'

export async function sourceOf(key: string): Promise<Source> {
  const m = await loadDb()
  if (m.get(key)) return 'db'
  if (process.env[key]) return 'env'
  return 'none'
}

export type RuntimeConfig = {
  geminiApiKey: string
  geminiTextModel: string
  geminiImageModel: string
  geminiVideoModel: string
  telegramBotToken: string
  telegramChatId: string
  telegramAdminId: string
  telegramWebhookSecret: string
  cronSecret: string
  postLanguage: string
}

// ---- status pra UI de onboarding ----

function maskSecret(v: string): string {
  if (!v) return ''
  return v.length <= 4 ? '••••' : `••••${v.slice(-4)}`
}

export type FieldStatus = SettingField & {
  source: Source
  set: boolean
  preview: string // mascarado se secret
  value: string // só pra não-secret (prefill do input); '' pra secret
}

export async function settingsOverview(): Promise<FieldStatus[]> {
  const m = await loadDb()
  return SETTINGS_SPEC.map((f) => {
    const dbv = m.get(f.key)
    const envv = process.env[f.key]
    const raw = dbv || envv || ''
    const source: Source = dbv ? 'db' : envv ? 'env' : 'none'
    return {
      ...f,
      source,
      set: Boolean(raw),
      preview: f.secret ? maskSecret(raw) : raw,
      value: f.secret ? '' : raw,
    }
  })
}

export async function onboardingComplete(): Promise<boolean> {
  const m = await loadDb()
  return SETTINGS_SPEC.filter((f) => f.required).every((f) =>
    Boolean(m.get(f.key) || process.env[f.key]),
  )
}

// bootstrap (env) — síncrono, só checa presença
export function bootstrapOverview() {
  return BOOTSTRAP_SPEC.map((f) => ({ ...f, set: Boolean(process.env[f.key]) }))
}

const BOOTSTRAP_REQUIRED = [
  'DATABASE_URL',
  'BETTER_AUTH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'ADMIN_EMAIL',
  'CONFIG_ENCRYPTION_KEY',
]

export function bootstrapComplete(): boolean {
  return BOOTSTRAP_REQUIRED.every((k) => Boolean(process.env[k]))
}

export async function runtimeConfig(): Promise<RuntimeConfig> {
  const get = await resolver()
  return {
    geminiApiKey: get('GEMINI_API_KEY'),
    geminiTextModel: get('GEMINI_TEXT_MODEL', 'gemini-flash-latest'),
    geminiImageModel: get('GEMINI_IMAGE_MODEL', 'gemini-3.1-flash-image'),
    geminiVideoModel: get('GEMINI_VIDEO_MODEL', 'veo-3.1-fast-generate-preview'),
    telegramBotToken: get('TELEGRAM_BOT_TOKEN'),
    telegramChatId: get('TELEGRAM_CHAT_ID'),
    telegramAdminId: get('TELEGRAM_ADMIN_ID'),
    telegramWebhookSecret: get('TELEGRAM_WEBHOOK_SECRET'),
    cronSecret: get('CRON_SECRET'),
    postLanguage: get('POST_LANGUAGE', 'pt-BR'),
  }
}
