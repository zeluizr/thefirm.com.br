import dotenv from 'dotenv'

// Loads .env (local dev) into process.env. `override: true` is important:
// Vite's dev server pre-loads .env through dotenv-expand, which corrupts values
// containing `$` (e.g. bcrypt hashes like `$2b$12$…`). Re-reading here with
// plain, non-expanding dotenv and overriding restores the literal value.
// In production (Railway) there is no .env file, so this is a harmless no-op
// and the real, directly-set environment variables are used as-is.
dotenv.config({ override: true })

function str(key: string, fallback = ''): string {
  const v = process.env[key]
  return v == null || v === '' ? fallback : v
}

function bool(key: string, fallback: boolean): boolean {
  const v = process.env[key]
  if (v == null || v === '') return fallback
  return v === 'true' || v === '1'
}

export const env = {
  NODE_ENV: str('NODE_ENV', 'development'),
  // Public base URL of the deployed app — used to build absolute media URLs
  // that the social platforms can fetch (Instagram/Facebook/Threads need them).
  APP_URL: str('APP_URL', 'http://localhost:3000'),

  DATABASE_URL: str('DATABASE_URL'),
  DATABASE_SSL: bool('DATABASE_SSL', false),

  SESSION_SECRET: str('SESSION_SECRET', 'dev-insecure-session-secret-change-me'),
  ADMIN_EMAIL: str('ADMIN_EMAIL'),
  ADMIN_PASSWORD_HASH: str('ADMIN_PASSWORD_HASH'),

  // Shared secret guarding POST /api/cron/publish-due. If empty, the endpoint
  // is open (fine for local dev / internal Railway worker).
  CRON_SECRET: str('CRON_SECRET'),

  bucket: {
    name: str('RAILWAY_BUCKET'),
    endpoint: str('RAILWAY_BUCKET_ENDPOINT'),
    region: str('RAILWAY_BUCKET_REGION', 'auto'),
    accessKeyId: str('RAILWAY_BUCKET_ACCESS_KEY_ID'),
    secretAccessKey: str('RAILWAY_BUCKET_SECRET_ACCESS_KEY'),
  },

  x: {
    apiKey: str('X_API_KEY'),
    apiSecret: str('X_API_SECRET'),
    accessToken: str('X_ACCESS_TOKEN'),
    accessTokenSecret: str('X_ACCESS_TOKEN_SECRET'),
  },

  meta: {
    appId: str('META_APP_ID'),
    appSecret: str('META_APP_SECRET'),
    accessToken: str('META_ACCESS_TOKEN'),
    facebookPageId: str('FACEBOOK_PAGE_ID'),
    instagramBusinessAccountId: str('INSTAGRAM_BUSINESS_ACCOUNT_ID'),
    graphVersion: str('META_GRAPH_VERSION', 'v21.0'),
  },

  threads: {
    accessToken: str('THREADS_ACCESS_TOKEN'),
    userId: str('THREADS_USER_ID'),
  },

  DRY_RUN: bool('DRY_RUN', true),
  DEFAULT_TIMEZONE: str('DEFAULT_TIMEZONE', 'America/Santiago'),
}

export function isStorageConfigured(): boolean {
  const b = env.bucket
  return Boolean(b.name && b.endpoint && b.accessKeyId && b.secretAccessKey)
}
