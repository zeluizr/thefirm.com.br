// Publish orchestration: takes a media item and fans it out to its platforms,
// honouring idempotency, dry-run, status transitions and media cleanup.
import { env } from './env.server'
import * as media from './media.server'
import { adapters, MissingCredentialsError } from './platforms'
import { deleteMedia, resolvePublicMediaUrl } from './storage.server'
import type { ItemStatus, MediaItem, Platform, PlatformStatus } from './types'

export interface ProcessOptions {
  // The dry-run button: simulate everything and persist NOTHING.
  dryRun?: boolean
  // Label for the logs (publish | dry-run | cron).
  trigger?: string
}

export interface PlatformOutcome {
  platform: Platform
  status: PlatformStatus
  remotePostId?: string
  permalink?: string
  error?: string
  duplicate?: boolean
}

export interface ProcessResult {
  itemId: string
  slug: string
  dryRun: boolean
  persisted: boolean
  finalStatus: ItemStatus | null
  outcomes: PlatformOutcome[]
}

interface Ctx {
  effectiveDry: boolean
  persist: boolean
  trigger: string
}

export async function processMediaItem(
  itemId: string,
  opts: ProcessOptions = {},
): Promise<ProcessResult> {
  const item = await media.getMediaItem(itemId)
  if (!item) throw new Error(`Media item ${itemId} not found`)

  const forceDry = Boolean(opts.dryRun)
  const persist = !forceDry
  // A simulation happens if the button forces it, OR DRY_RUN is globally on.
  const effectiveDry = forceDry || env.DRY_RUN
  const trigger = opts.trigger ?? (forceDry ? 'dry-run' : 'publish')

  if (item.platforms.length === 0) {
    if (persist) await media.setItemStatus(item.id, 'completed')
    return {
      itemId: item.id,
      slug: item.slug,
      dryRun: effectiveDry,
      persisted: persist,
      finalStatus: persist ? 'completed' : null,
      outcomes: [],
    }
  }

  if (persist) await media.setItemStatus(item.id, 'publishing')
  await media.addLog({
    mediaItemId: item.id,
    action: trigger,
    status: 'info',
    message: `${forceDry ? 'Dry-run' : 'Publish'} → ${item.platforms.join(', ')}${
      effectiveDry && !forceDry ? ' (DRY_RUN on)' : ''
    }`,
  })

  const ctx: Ctx = { effectiveDry, persist, trigger }
  const outcomes: PlatformOutcome[] = []
  for (const platform of item.platforms) {
    outcomes.push(await publishToPlatform(item, platform, ctx))
  }

  let finalStatus: ItemStatus | null = null
  if (persist) {
    const anyFailed = outcomes.some((o) => o.status === 'failed')
    finalStatus = anyFailed ? 'failed' : 'completed'
    await media.setItemStatus(item.id, finalStatus)
    await media.addLog({
      mediaItemId: item.id,
      action: trigger,
      status: anyFailed ? 'error' : 'success',
      message: `Item ${finalStatus}`,
    })

    // Cleanup only after a real, fully-successful publish.
    if (finalStatus === 'completed' && !item.retain_media_after_publish && !effectiveDry) {
      try {
        await deleteMedia(item.media_url)
        await media.setMediaUrl(item.id, '')
        await media.addLog({
          mediaItemId: item.id,
          action: 'cleanup',
          status: 'success',
          message: 'Media deleted from bucket after successful publish',
        })
      } catch (e) {
        await media.addLog({
          mediaItemId: item.id,
          action: 'cleanup',
          status: 'error',
          message: `Media cleanup failed: ${errMessage(e)}`,
        })
      }
    }
  }

  return {
    itemId: item.id,
    slug: item.slug,
    dryRun: effectiveDry,
    persisted: persist,
    finalStatus,
    outcomes,
  }
}

async function publishToPlatform(
  item: MediaItem,
  platform: Platform,
  ctx: Ctx,
): Promise<PlatformOutcome> {
  const { effectiveDry, persist, trigger } = ctx
  const existing = persist ? await media.getPublication(item.id, platform) : null

  // Idempotency — never publish the same platform twice.
  if (existing && (existing.status === 'published' || existing.remote_post_id)) {
    await media.addLog({
      mediaItemId: item.id,
      platform,
      action: trigger,
      status: 'skipped',
      message: 'Already published — skipped (idempotent)',
    })
    return {
      platform,
      status: 'published',
      duplicate: true,
      remotePostId: existing.remote_post_id ?? undefined,
      permalink: existing.permalink ?? undefined,
    }
  }

  if (persist) {
    await media.ensurePublication(item.id, platform)
    await media.updatePublication(item.id, platform, {
      status: 'publishing',
      attempts: (existing?.attempts ?? 0) + 1,
      error: null,
    })
  }

  try {
    const mediaUrl = await resolvePublicMediaUrl(item.media_url)
    const out = await adapters[platform].publishMedia(
      {
        caption: item.caption,
        mediaUrl,
        mediaType: item.media_type,
        slug: item.slug,
      },
      { dryRun: effectiveDry },
    )

    if (persist) {
      await media.updatePublication(item.id, platform, {
        status: 'published',
        remotePostId: out.remotePostId,
        permalink: out.permalink ?? null,
        publishedAt: new Date().toISOString(),
        error: null,
      })
    }
    await media.addLog({
      mediaItemId: item.id,
      platform,
      action: trigger,
      status: 'success',
      message: `${effectiveDry ? '[DRY] ' : ''}Published — ${out.permalink ?? out.remotePostId}`,
    })
    return {
      platform,
      status: 'published',
      remotePostId: out.remotePostId,
      permalink: out.permalink,
    }
  } catch (e) {
    const missing = e instanceof MissingCredentialsError
    const status: PlatformStatus = missing ? 'skipped' : 'failed'
    const message = errMessage(e)
    if (persist) {
      await media.updatePublication(item.id, platform, { status, error: message })
    }
    await media.addLog({
      mediaItemId: item.id,
      platform,
      action: trigger,
      status: missing ? 'skipped' : 'error',
      message,
    })
    return { platform, status, error: message }
  }
}

// Runs the queue: every item that is ready or whose schedule is due.
export async function processDueItems(
  opts: { dryRun?: boolean } = {},
): Promise<{ processed: number; results: ProcessResult[] }> {
  const items = await media.listDueItems()
  const results: ProcessResult[] = []
  for (const item of items) {
    results.push(await processMediaItem(item.id, { dryRun: opts.dryRun, trigger: 'cron' }))
  }
  return { processed: results.length, results }
}

function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}
