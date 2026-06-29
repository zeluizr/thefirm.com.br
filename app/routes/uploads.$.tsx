import { readFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'

import { env } from '@server/lib/env'
import type { Route } from './+types/uploads.$'

// serve a mídia gerada a partir de MEDIA_DIR (o react-router-serve não serve
// arquivos escritos em runtime). path = MEDIA_PUBLIC_PATH (/uploads por padrão).
const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
}

export async function loader({ params }: Route.LoaderArgs) {
  const name = basename(params['*'] ?? '') // basename evita path traversal
  if (!name) throw new Response('not found', { status: 404 })

  try {
    const data = await readFile(join(env.MEDIA_DIR, name))
    return new Response(data, {
      headers: {
        'content-type': MIME[extname(name).toLowerCase()] ?? 'application/octet-stream',
        'cache-control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    throw new Response('not found', { status: 404 })
  }
}
