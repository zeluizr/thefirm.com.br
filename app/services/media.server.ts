// Data access for media items, their per-platform publications, and logs.
import { query, queryOne } from './db.server'
import type {
  ItemStatus,
  MediaItem,
  MediaType,
  Platform,
  PlatformPublication,
  PlatformStatus,
  PublishLog,
} from './types'
import { DEFAULT_PERSONA } from './types'

// ── slugs ──────────────────────────────────────────────────────────────────

export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || 'media'
  let candidate = root
  let n = 1
  // Loop until we find a slug not yet taken.
  while (await queryOne('select 1 from media_items where slug = $1', [candidate])) {
    n += 1
    candidate = `${root}-${n}`
  }
  return candidate
}

// ── media items ──────────────────────────────────────────────────────────────

export interface CreateMediaInput {
  title: string
  caption?: string
  mediaUrl?: string
  mediaType: MediaType
  platforms: Platform[]
  publishAt?: string | null
  persona?: string
  retainMediaAfterPublish?: boolean
  slug?: string
}

export async function createMediaItem(input: CreateMediaInput): Promise<MediaItem> {
  const slug = input.slug ? await uniqueSlug(input.slug) : await uniqueSlug(input.title)
  const row = await queryOne<MediaItem>(
    `insert into media_items
       (slug, title, caption, media_url, media_type, platforms, publish_at,
        persona, retain_media_after_publish)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     returning *`,
    [
      slug,
      input.title,
      input.caption ?? '',
      input.mediaUrl ?? '',
      input.mediaType,
      input.platforms,
      input.publishAt ?? null,
      input.persona ?? DEFAULT_PERSONA,
      input.retainMediaAfterPublish ?? true,
    ],
  )
  return row as MediaItem
}

export interface UpdateMediaInput {
  title?: string
  caption?: string
  mediaUrl?: string
  mediaType?: MediaType
  platforms?: Platform[]
  publishAt?: string | null
  persona?: string
  retainMediaAfterPublish?: boolean
}

export async function updateMediaItem(
  id: string,
  patch: UpdateMediaInput,
): Promise<MediaItem | null> {
  const sets: string[] = []
  const values: unknown[] = []
  const add = (col: string, value: unknown) => {
    values.push(value)
    sets.push(`${col} = $${values.length}`)
  }

  if (patch.title !== undefined) add('title', patch.title)
  if (patch.caption !== undefined) add('caption', patch.caption)
  if (patch.mediaUrl !== undefined) add('media_url', patch.mediaUrl)
  if (patch.mediaType !== undefined) add('media_type', patch.mediaType)
  if (patch.platforms !== undefined) add('platforms', patch.platforms)
  if (patch.publishAt !== undefined) add('publish_at', patch.publishAt)
  if (patch.persona !== undefined) add('persona', patch.persona)
  if (patch.retainMediaAfterPublish !== undefined)
    add('retain_media_after_publish', patch.retainMediaAfterPublish)

  if (sets.length === 0) return getMediaItem(id)

  sets.push('updated_at = now()')
  values.push(id)
  return queryOne<MediaItem>(
    `update media_items set ${sets.join(', ')} where id = $${values.length} returning *`,
    values,
  )
}

export async function setItemStatus(id: string, status: ItemStatus): Promise<void> {
  await query('update media_items set status = $1, updated_at = now() where id = $2', [
    status,
    id,
  ])
}

export async function setMediaUrl(id: string, mediaUrl: string): Promise<void> {
  await query('update media_items set media_url = $1, updated_at = now() where id = $2', [
    mediaUrl,
    id,
  ])
}

export function getMediaItem(id: string): Promise<MediaItem | null> {
  return queryOne<MediaItem>('select * from media_items where id = $1', [id])
}

export function getMediaItemBySlug(slug: string): Promise<MediaItem | null> {
  return queryOne<MediaItem>('select * from media_items where slug = $1', [slug])
}

export function listMediaItems(): Promise<MediaItem[]> {
  return query<MediaItem>('select * from media_items order by created_at desc')
}

export async function deleteMediaItem(id: string): Promise<void> {
  await query('delete from media_items where id = $1', [id])
}

// Items whose work is due: marked ready, or scheduled with a past publish_at.
export function listDueItems(): Promise<MediaItem[]> {
  return query<MediaItem>(
    `select * from media_items
      where status in ('ready', 'scheduled')
        and (publish_at is null or publish_at <= now())
      order by coalesce(publish_at, created_at) asc`,
  )
}

// Completed items that have media — the public fotolog wall (newest first).
export function listFotologPosts(limit = 60): Promise<MediaItem[]> {
  return query<MediaItem>(
    `select * from media_items
      where status = 'completed' and coalesce(media_url, '') <> ''
      order by created_at desc
      limit $1`,
    [limit],
  )
}

// Completed items with at least one published platform — for the public archive.
export function listPublishedForArchive(limit = 60): Promise<MediaItem[]> {
  return query<MediaItem>(
    `select distinct mi.*
       from media_items mi
       join platform_publications pp on pp.media_item_id = mi.id
      where mi.status = 'completed' and pp.status = 'published'
      order by mi.updated_at desc
      limit $1`,
    [limit],
  )
}

// ── platform publications ────────────────────────────────────────────────────

export function listPublications(mediaItemId: string): Promise<PlatformPublication[]> {
  return query<PlatformPublication>(
    'select * from platform_publications where media_item_id = $1 order by platform asc',
    [mediaItemId],
  )
}

export function getPublication(
  mediaItemId: string,
  platform: Platform,
): Promise<PlatformPublication | null> {
  return queryOne<PlatformPublication>(
    'select * from platform_publications where media_item_id = $1 and platform = $2',
    [mediaItemId, platform],
  )
}

// Create the publication row if missing (idempotent on the unique constraint).
export async function ensurePublication(
  mediaItemId: string,
  platform: Platform,
): Promise<PlatformPublication> {
  const row = await queryOne<PlatformPublication>(
    `insert into platform_publications (media_item_id, platform)
     values ($1, $2)
     on conflict (media_item_id, platform) do update set updated_at = now()
     returning *`,
    [mediaItemId, platform],
  )
  return row as PlatformPublication
}

export interface PublicationPatch {
  status?: PlatformStatus
  remotePostId?: string | null
  permalink?: string | null
  error?: string | null
  attempts?: number
  publishedAt?: string | null
}

export async function updatePublication(
  mediaItemId: string,
  platform: Platform,
  patch: PublicationPatch,
): Promise<void> {
  const sets: string[] = []
  const values: unknown[] = []
  const add = (col: string, value: unknown) => {
    values.push(value)
    sets.push(`${col} = $${values.length}`)
  }

  if (patch.status !== undefined) add('status', patch.status)
  if (patch.remotePostId !== undefined) add('remote_post_id', patch.remotePostId)
  if (patch.permalink !== undefined) add('permalink', patch.permalink)
  if (patch.error !== undefined) add('error', patch.error)
  if (patch.attempts !== undefined) add('attempts', patch.attempts)
  if (patch.publishedAt !== undefined) add('published_at', patch.publishedAt)

  sets.push('updated_at = now()')
  values.push(mediaItemId, platform)
  await query(
    `update platform_publications set ${sets.join(', ')}
      where media_item_id = $${values.length - 1} and platform = $${values.length}`,
    values,
  )
}

// Drop publication rows for platforms no longer selected on the item.
export async function prunePublications(
  mediaItemId: string,
  keep: Platform[],
): Promise<void> {
  if (keep.length === 0) {
    await query('delete from platform_publications where media_item_id = $1', [mediaItemId])
    return
  }
  await query(
    `delete from platform_publications
      where media_item_id = $1 and not (platform = any($2))`,
    [mediaItemId, keep],
  )
}

// ── logs ─────────────────────────────────────────────────────────────────────

export async function addLog(entry: {
  mediaItemId?: string | null
  platform?: Platform | null
  action: string
  status?: string
  message?: string
}): Promise<void> {
  await query(
    `insert into publish_logs (media_item_id, platform, action, status, message)
     values ($1, $2, $3, $4, $5)`,
    [
      entry.mediaItemId ?? null,
      entry.platform ?? null,
      entry.action,
      entry.status ?? 'info',
      entry.message ?? '',
    ],
  )
}

export function listLogs(limit = 200): Promise<PublishLog[]> {
  return query<PublishLog>(
    'select * from publish_logs order by created_at desc limit $1',
    [limit],
  )
}

export function listLogsForItem(mediaItemId: string, limit = 100): Promise<PublishLog[]> {
  return query<PublishLog>(
    'select * from publish_logs where media_item_id = $1 order by created_at desc limit $2',
    [mediaItemId, limit],
  )
}

// ── dashboard counters ───────────────────────────────────────────────────────

export async function dashboardCounts(): Promise<Record<string, number>> {
  const rows = await query<{ status: ItemStatus; count: string }>(
    'select status, count(*)::int as count from media_items group by status',
  )
  const counts: Record<string, number> = {
    draft: 0,
    ready: 0,
    scheduled: 0,
    publishing: 0,
    completed: 0,
    failed: 0,
    total: 0,
  }
  for (const r of rows) {
    counts[r.status] = Number(r.count)
    counts.total += Number(r.count)
  }
  return counts
}
