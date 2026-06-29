// Facebook Page adapter — Meta Graph API.
// Image → /{page-id}/photos (url + caption).
// Video → /{page-id}/videos (file_url + description).
// META_ACCESS_TOKEN must be a Page access token for FACEBOOK_PAGE_ID.
import { env } from '../env.server'
import type { Platform } from '../types'
import {
  MissingCredentialsError,
  type PlatformAdapter,
  type PublishInput,
  type PublishOptions,
  type PublishResult,
} from './types'
import { mockResult, readJson } from './shared.server'

const platform: Platform = 'facebook'

function config() {
  const token = env.meta.accessToken
  const pageId = env.meta.facebookPageId
  if (!token || !pageId) {
    throw new MissingCredentialsError(
      'Facebook credentials missing (META_ACCESS_TOKEN / FACEBOOK_PAGE_ID).',
    )
  }
  return { token, pageId, base: `https://graph.facebook.com/${env.meta.graphVersion}` }
}

async function publishMedia(
  input: PublishInput,
  opts: PublishOptions = {},
): Promise<PublishResult> {
  if (opts.dryRun) return mockResult(platform, input)

  const { token, pageId, base } = config()

  if (input.mediaType === 'video') {
    const params = new URLSearchParams({
      file_url: input.mediaUrl,
      description: input.caption,
      access_token: token,
    })
    const body = await readJson(
      await fetch(`${base}/${pageId}/videos`, { method: 'POST', body: params }),
      'Facebook publish video',
    )
    const id = body.id as string
    return {
      remotePostId: id,
      permalink: `https://www.facebook.com/${pageId}/videos/${id}`,
      raw: body,
    }
  }

  const params = new URLSearchParams({
    url: input.mediaUrl,
    caption: input.caption,
    access_token: token,
  })
  const body = await readJson(
    await fetch(`${base}/${pageId}/photos`, { method: 'POST', body: params }),
    'Facebook publish photo',
  )
  const id = (body.post_id ?? body.id) as string
  return {
    remotePostId: id,
    permalink: `https://www.facebook.com/${id}`,
    raw: body,
  }
}

export const facebookAdapter: PlatformAdapter = { platform, publishMedia }
