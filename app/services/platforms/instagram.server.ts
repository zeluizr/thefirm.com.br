// Instagram adapter — Meta Graph API (Instagram Content Publishing).
// Flow: create media container → (poll for video) → media_publish → fetch permalink.
import { env } from '../env.server'
import type { Platform } from '../types'
import {
  MissingCredentialsError,
  type PlatformAdapter,
  type PublishInput,
  type PublishOptions,
  type PublishResult,
} from './types'
import { mockResult, readJson, sleep } from './shared.server'

const platform: Platform = 'instagram'

function config() {
  const token = env.meta.accessToken
  const igUserId = env.meta.instagramBusinessAccountId
  if (!token || !igUserId) {
    throw new MissingCredentialsError(
      'Instagram credentials missing (META_ACCESS_TOKEN / INSTAGRAM_BUSINESS_ACCOUNT_ID).',
    )
  }
  return { token, igUserId, base: `https://graph.facebook.com/${env.meta.graphVersion}` }
}

async function waitForContainer(base: string, id: string, token: string): Promise<void> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const res = await fetch(`${base}/${id}?fields=status_code&access_token=${token}`)
    const body = await readJson(res, 'Instagram container status')
    if (body.status_code === 'FINISHED') return
    if (body.status_code === 'ERROR' || body.status_code === 'EXPIRED') {
      throw new Error(`Instagram media processing ${body.status_code}`)
    }
    await sleep(3000)
  }
  throw new Error('Instagram media processing timed out')
}

async function publishMedia(
  input: PublishInput,
  opts: PublishOptions = {},
): Promise<PublishResult> {
  if (opts.dryRun) return mockResult(platform, input)

  const { token, igUserId, base } = config()

  // 1. Create the media container.
  const createParams = new URLSearchParams({ caption: input.caption, access_token: token })
  if (input.mediaType === 'video') {
    createParams.set('media_type', 'REELS')
    createParams.set('video_url', input.mediaUrl)
  } else {
    createParams.set('image_url', input.mediaUrl)
  }
  const created = await readJson(
    await fetch(`${base}/${igUserId}/media`, { method: 'POST', body: createParams }),
    'Instagram create container',
  )
  const creationId = created.id as string

  // 2. Videos process asynchronously — wait until the container is ready.
  if (input.mediaType === 'video') {
    await waitForContainer(base, creationId, token)
  }

  // 3. Publish the container.
  const published = await readJson(
    await fetch(`${base}/${igUserId}/media_publish`, {
      method: 'POST',
      body: new URLSearchParams({ creation_id: creationId, access_token: token }),
    }),
    'Instagram media_publish',
  )
  const mediaId = published.id as string

  // 4. Resolve the permalink (best effort).
  let permalink: string | undefined
  try {
    const meta = await readJson(
      await fetch(`${base}/${mediaId}?fields=permalink&access_token=${token}`),
      'Instagram permalink',
    )
    permalink = meta.permalink
  } catch {
    permalink = undefined
  }

  return { remotePostId: mediaId, permalink, raw: published }
}

export const instagramAdapter: PlatformAdapter = { platform, publishMedia }
