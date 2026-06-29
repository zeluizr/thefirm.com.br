// Turns the files you drop into public/posts/ into live fotolog posts.
// - media_url points at the committed static file (/posts/<file>) — no bucket
//   needed, persists on Railway because it ships with the build.
// - posts have NO platforms (pure fotolog, no social cross-post / no fake links).
// - idempotent: a file whose slug already exists is skipped, so it is safe to
//   run on every deploy.
// Optional captions: public/posts/manifest.json
//   { "01-minha-loucura.jpg": { "title": "...", "caption": "..." }, ... }
// Usage: npm run seed:posts
import { readFile, readdir } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'

import { getPool } from '../app/services/db.server'
import * as media from '../app/services/media.server'
import type { MediaType } from '../app/services/types'

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'])
const VIDEO_EXT = new Set(['.mp4', '.webm', '.mov', '.m4v'])

type Manifest = Record<string, { title?: string; caption?: string }>

async function loadManifest(dir: string): Promise<Manifest> {
  try {
    return JSON.parse(await readFile(join(dir, 'manifest.json'), 'utf8')) as Manifest
  } catch {
    return {}
  }
}

function titleFromFile(file: string): string {
  return basename(file, extname(file))
    .replace(/^[0-9]+[-_]*/, '') // drop leading order prefix like "01-"
    .replace(/[-_]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

async function run() {
  const dir = join(process.cwd(), 'public', 'posts')
  let files: string[]
  try {
    files = await readdir(dir)
  } catch {
    console.log('public/posts/ não existe — nada a fazer.')
    return
  }

  const manifest = await loadManifest(dir)
  // Sort ascending, create in reverse so the first filename (e.g. "01-…") ends
  // up newest → shown at the top of the fotolog.
  const mediaFiles = files
    .filter((f) => {
      const ext = extname(f).toLowerCase()
      return IMAGE_EXT.has(ext) || VIDEO_EXT.has(ext)
    })
    .sort()
    .reverse()

  if (mediaFiles.length === 0) {
    console.log('Sem mídias em public/posts/.')
    return
  }

  let created = 0
  let skipped = 0
  for (const file of mediaFiles) {
    const ext = extname(file).toLowerCase()
    const mediaType: MediaType = VIDEO_EXT.has(ext) ? 'video' : 'image'
    const slug = media.slugify(basename(file, ext)) || `post-${created}`

    if (await media.getMediaItemBySlug(slug)) {
      skipped += 1
      console.log(`· skip   ${slug} (já existe)`)
      continue
    }

    const entry = manifest[file] ?? {}
    const item = await media.createMediaItem({
      slug,
      title: entry.title ?? titleFromFile(file),
      caption: entry.caption ?? '',
      mediaUrl: `/posts/${file}`,
      mediaType,
      platforms: [],
    })
    await media.setItemStatus(item.id, 'completed')
    created += 1
    console.log(`✓ post   ${slug}  (${mediaType})`)
  }

  console.log(`\n${created} post(s) criado(s), ${skipped} ignorado(s).`)
}

// Boot-safe: never fail a Railway deploy because of content seeding.
run()
  .catch((e) => console.error('[seed:posts]', e))
  .finally(async () => {
    await getPool().end().catch(() => {})
    process.exit(0)
  })
