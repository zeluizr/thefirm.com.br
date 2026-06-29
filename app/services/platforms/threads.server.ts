// Threads adapter — Threads Graph API.
// Flow: create container → (poll for video) → threads_publish → fetch permalink.
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

const platform: Platform = 'threads'
const BASE = 'https://graph.threads.net/v1.0'

function config() {
  const token = env.threads.accessToken
  const userId = env.threads.userId
  if (!token || !userId) {
    throw new MissingCredentialsError(
      'Threads credentials missing (THREADS_ACCESS_TOKEN / THREADS_USER_ID).',
    )
  }
  return { token, userId }
}

async function waitForContainer(id: string, token: string): Promise<void> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const res = await fetch(`${BASE}/${id}?fields=status&access_token=${token}`)
    const body = await readJson(res, 'Threads container status')
    if (body.status === 'FINISHED') return
    if (body.status === 'ERROR' || body.status === 'EXPIRED') {
      throw new Error(`Threads media processing ${body.status}`)
    }
    await sleep(3000)
  }
  throw new Error('Threads media processing timed out')
}

async function publishMedia(
  input: PublishInput,
  opts: PublishOptions = {},
): Promise<PublishResult> {
  if (opts.dryRun) return mockResult(platform, input)

  const { token, userId } = config()

  // 1. Create the container.
  const createParams = new URLSearchParams({ text: input.caption, access_token: token })
  if (input.mediaType === 'video') {
    createParams.set('media_type', 'VIDEO')
    createParams.set('video_url', input.mediaUrl)
  } else {
    createParams.set('media_type', 'IMAGE')
    createParams.set('image_url', input.mediaUrl)
  }
  const created = await readJson(
    await fetch(`${BASE}/${userId}/threads`, { method: 'POST', body: createParams }),
    'Threads create container',
  )
  const creationId = created.id as string

  // 2. Wait for media to finish processing (mostly relevant for video).
  await waitForContainer(creationId, token)

  // 3. Publish.
  const published = await readJson(
    await fetch(`${BASE}/${userId}/threads_publish`, {
      method: 'POST',
      body: new URLSearchParams({ creation_id: creationId, access_token: token }),
    }),
    'Threads publish',
  )
  const mediaId = published.id as string

  // 4. Permalink (best effort).
  let permalink: string | undefined
  try {
    const meta = await readJson(
      await fetch(`${BASE}/${mediaId}?fields=permalink&access_token=${token}`),
      'Threads permalink',
    )
    permalink = meta.permalink
  } catch {
    permalink = undefined
  }

  return { remotePostId: mediaId, permalink, raw: published }
}

export const threadsAdapter: PlatformAdapter = { platform, publishMedia }
