// X / Twitter adapter.
// Media upload: v1.1 media/upload (OAuth 1.0a user context).
// Tweet:        v2 POST /2/tweets.
// No browser automation — official API only.
import crypto from 'node:crypto'

import { env } from '../env.server'
import type { Platform } from '../types'
import {
  MissingCredentialsError,
  type PlatformAdapter,
  type PublishInput,
  type PublishOptions,
  type PublishResult,
} from './types'
import { fetchMediaBytes, mockResult, readJson, sleep } from './shared.server'

const platform: Platform = 'x'

const UPLOAD_URL = 'https://upload.twitter.com/1.1/media/upload.json'
const TWEET_URL = 'https://api.twitter.com/2/tweets'

interface Creds {
  apiKey: string
  apiSecret: string
  accessToken: string
  accessTokenSecret: string
}

function requireCreds(): Creds {
  const { apiKey, apiSecret, accessToken, accessTokenSecret } = env.x
  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
    throw new MissingCredentialsError(
      'X credentials missing (X_API_KEY / X_API_SECRET / X_ACCESS_TOKEN / X_ACCESS_TOKEN_SECRET).',
    )
  }
  return { apiKey, apiSecret, accessToken, accessTokenSecret }
}

function percentEncode(str: string): string {
  return encodeURIComponent(str).replace(
    /[!*'()]/g,
    (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase(),
  )
}

// Builds an OAuth 1.0a Authorization header. `signedParams` must contain any
// query-string or x-www-form-urlencoded body params (multipart/JSON bodies are
// not part of the signature).
function authHeader(
  method: string,
  url: string,
  creds: Creds,
  signedParams: Record<string, string> = {},
): string {
  const oauth: Record<string, string> = {
    oauth_consumer_key: creds.apiKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: creds.accessToken,
    oauth_version: '1.0',
  }

  const all = { ...oauth, ...signedParams }
  const paramString = Object.keys(all)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(all[k])}`)
    .join('&')

  const baseString = [
    method.toUpperCase(),
    percentEncode(url),
    percentEncode(paramString),
  ].join('&')
  const signingKey = `${percentEncode(creds.apiSecret)}&${percentEncode(creds.accessTokenSecret)}`
  const signature = crypto.createHmac('sha1', signingKey).update(baseString).digest('base64')

  const headerParams: Record<string, string> = { ...oauth, oauth_signature: signature }
  return (
    'OAuth ' +
    Object.keys(headerParams)
      .sort()
      .map((k) => `${percentEncode(k)}="${percentEncode(headerParams[k])}"`)
      .join(', ')
  )
}

// POST application/x-www-form-urlencoded (params are signed).
async function postForm(
  url: string,
  params: Record<string, string>,
  creds: Creds,
  context: string,
): Promise<any> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: authHeader('POST', url, creds, params),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params).toString(),
  })
  return readJson(res, context)
}

async function uploadImage(bytes: Buffer, creds: Creds): Promise<string> {
  const form = new FormData()
  form.append('media', new Blob([new Uint8Array(bytes)]))
  const res = await fetch(UPLOAD_URL, {
    method: 'POST',
    headers: { Authorization: authHeader('POST', UPLOAD_URL, creds) },
    body: form,
  })
  const body = await readJson(res, 'X media upload')
  return body.media_id_string as string
}

// Chunked upload for video: INIT → APPEND(s) → FINALIZE → poll STATUS.
async function uploadVideo(bytes: Buffer, creds: Creds): Promise<string> {
  const init = await postForm(
    UPLOAD_URL,
    {
      command: 'INIT',
      total_bytes: String(bytes.length),
      media_type: 'video/mp4',
      media_category: 'tweet_video',
    },
    creds,
    'X video INIT',
  )
  const mediaId = init.media_id_string as string

  const chunkSize = 4 * 1024 * 1024 // 4MB
  let segment = 0
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, offset + chunkSize)
    const form = new FormData()
    form.append('command', 'APPEND')
    form.append('media_id', mediaId)
    form.append('segment_index', String(segment))
    form.append('media', new Blob([new Uint8Array(chunk)]))
    const res = await fetch(UPLOAD_URL, {
      method: 'POST',
      headers: { Authorization: authHeader('POST', UPLOAD_URL, creds) },
      body: form,
    })
    if (!res.ok) await readJson(res, 'X video APPEND')
    segment += 1
  }

  const finalize = await postForm(
    UPLOAD_URL,
    { command: 'FINALIZE', media_id: mediaId },
    creds,
    'X video FINALIZE',
  )

  // Wait for transcoding if the API asks us to.
  let state = finalize.processing_info
  while (state && (state.state === 'pending' || state.state === 'in_progress')) {
    await sleep((state.check_after_secs ?? 2) * 1000)
    const status = await fetch(
      `${UPLOAD_URL}?command=STATUS&media_id=${mediaId}`,
      {
        headers: {
          Authorization: authHeader('GET', UPLOAD_URL, creds, {
            command: 'STATUS',
            media_id: mediaId,
          }),
        },
      },
    )
    const body = await readJson(status, 'X video STATUS')
    state = body.processing_info
  }
  if (state && state.state === 'failed') {
    throw new Error(`X video processing failed: ${state.error?.message ?? 'unknown'}`)
  }
  return mediaId
}

async function publishMedia(
  input: PublishInput,
  opts: PublishOptions = {},
): Promise<PublishResult> {
  if (opts.dryRun) return mockResult(platform, input)

  const creds = requireCreds()
  const bytes = await fetchMediaBytes(input.mediaUrl)
  const mediaId =
    input.mediaType === 'video'
      ? await uploadVideo(bytes, creds)
      : await uploadImage(bytes, creds)

  const res = await fetch(TWEET_URL, {
    method: 'POST',
    headers: {
      Authorization: authHeader('POST', TWEET_URL, creds),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: input.caption, media: { media_ids: [mediaId] } }),
  })
  const body = await readJson(res, 'X create tweet')
  const id = body.data?.id as string

  return {
    remotePostId: id,
    permalink: `https://x.com/i/web/status/${id}`,
    raw: body,
  }
}

export const xAdapter: PlatformAdapter = { platform, publishMedia }
