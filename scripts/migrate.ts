// Applies pending SQL migrations from /migrations in filename order.
// Usage: npm run migrate
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

import { getPool, query } from '../app/services/db.server'

async function main() {
  await query(`create table if not exists schema_migrations (
    name        text primary key,
    applied_at  timestamptz not null default now()
  )`)

  const dir = join(process.cwd(), 'migrations')
  const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort()
  const applied = new Set(
    (await query<{ name: string }>('select name from schema_migrations')).map((r) => r.name),
  )

  let count = 0
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`· skip   ${file}`)
      continue
    }
    const sql = await readFile(join(dir, file), 'utf8')
    const client = await getPool().connect()
    try {
      await client.query('begin')
      await client.query(sql)
      await client.query('insert into schema_migrations (name) values ($1)', [file])
      await client.query('commit')
      console.log(`✓ apply  ${file}`)
      count += 1
    } catch (e) {
      await client.query('rollback')
      console.error(`✗ failed ${file}`)
      throw e
    } finally {
      client.release()
    }
  }

  console.log(`\nDone — ${count} migration(s) applied.`)
  await getPool().end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
