import pg from 'pg'

import { env } from './env.server'

// Return timestamps as raw ISO-ish strings (not JS Date) so loader payloads
// serialize cleanly and our `string` types stay honest.
pg.types.setTypeParser(1114, (v) => v) // timestamp
pg.types.setTypeParser(1184, (v) => v) // timestamptz

let pool: pg.Pool | null = null

export function getPool(): pg.Pool {
  if (!pool) {
    if (!env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set — configure it in your environment.')
    }
    pool = new pg.Pool({
      connectionString: env.DATABASE_URL,
      ssl: env.DATABASE_SSL ? { rejectUnauthorized: false } : undefined,
      max: 8,
    })
  }
  return pool
}

export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await getPool().query(text, params as unknown[])
  return result.rows as T[]
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params)
  return rows[0] ?? null
}
