import type { Platform } from '../types'
import type { PublishInput, PublishResult } from './types'

// Deterministic-ish mock used by every adapter when DRY_RUN is active.
export function mockResult(platform: Platform, input: PublishInput): PublishResult {
  const id = `dryrun-${platform}-${input.slug}-${Date.now()}`
  return {
    remotePostId: id,
    permalink: `https://dry-run.thefirm.com.br/${platform}/${id}`,
    raw: { dryRun: true, caption: input.caption, mediaType: input.mediaType },
  }
}

// Fetch the media as bytes (adapters that upload raw bytes need this).
export async function fetchMediaBytes(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Could not fetch media (${res.status}) from ${url}`)
  }
  return Buffer.from(await res.arrayBuffer())
}

// Read a fetch Response as JSON, throwing a readable error on non-2xx.
export async function readJson(res: Response, context: string): Promise<any> {
  const text = await res.text()
  let body: any = text
  try {
    body = text ? JSON.parse(text) : {}
  } catch {
    // leave as text
  }
  if (!res.ok) {
    const detail =
      body?.error?.message || body?.errors?.[0]?.message || body?.detail || text || res.statusText
    throw new Error(`${context} failed (${res.status}): ${detail}`)
  }
  return body
}

// Small sleep used while polling async media processing.
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
