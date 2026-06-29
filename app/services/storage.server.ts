// Media storage. Uses the Railway Storage Bucket (S3-compatible) when
// configured; otherwise falls back to the local filesystem (public/uploads)
// so the app is fully usable in local dev without any cloud setup.
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

import { env, isStorageConfigured } from './env.server'

export interface UploadInput {
  buffer: Buffer
  filename: string
  contentType: string
  slug: string
}

let s3: S3Client | null = null

function client(): S3Client {
  if (!s3) {
    s3 = new S3Client({
      region: env.bucket.region,
      endpoint: env.bucket.endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: env.bucket.accessKeyId,
        secretAccessKey: env.bucket.secretAccessKey,
      },
    })
  }
  return s3
}

function safeName(filename: string): string {
  const cleaned = filename.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '')
  return cleaned || 'file'
}

// Stores the media and returns the reference we persist as media_url:
//  - S3 driver:   the object key (e.g. "media/<slug>/<ts>-<name>")
//  - local driver: a public path (e.g. "/uploads/<slug>/<ts>-<name>")
export async function uploadMedia(input: UploadInput): Promise<string> {
  const key = `media/${input.slug}/${Date.now()}-${safeName(input.filename)}`

  if (isStorageConfigured()) {
    await client().send(
      new PutObjectCommand({
        Bucket: env.bucket.name,
        Key: key,
        Body: input.buffer,
        ContentType: input.contentType,
      }),
    )
    return key
  }

  // Local fallback — write under public/ so the dev server serves it directly.
  const publicPath = `/uploads/${input.slug}/${Date.now()}-${safeName(input.filename)}`
  const absolute = join(process.cwd(), 'public', publicPath)
  await mkdir(dirname(absolute), { recursive: true })
  await writeFile(absolute, input.buffer)
  return publicPath
}

const isHttp = (ref: string) => /^https?:\/\//i.test(ref)
const isLocal = (ref: string) => ref.startsWith('/')

// Absolute, publicly fetchable URL — what we hand to the platform adapters.
export async function resolvePublicMediaUrl(ref: string): Promise<string> {
  if (!ref) return ''
  if (isHttp(ref)) return ref
  if (isLocal(ref)) return `${env.APP_URL.replace(/\/$/, '')}${ref}`
  // S3 key → time-limited signed URL.
  return getSignedUrl(
    client(),
    new GetObjectCommand({ Bucket: env.bucket.name, Key: ref }),
    { expiresIn: 60 * 60 }, // 1h is plenty for a platform to fetch the asset
  )
}

// Browser-loadable URL for admin previews. Local paths stay relative so they
// work in dev even when APP_URL is unset.
export async function previewUrl(ref: string): Promise<string> {
  if (!ref) return ''
  if (isHttp(ref) || isLocal(ref)) return ref
  return getSignedUrl(
    client(),
    new GetObjectCommand({ Bucket: env.bucket.name, Key: ref }),
    { expiresIn: 60 * 60 },
  )
}

export async function deleteMedia(ref: string): Promise<void> {
  if (!ref || isHttp(ref)) return
  if (isLocal(ref)) {
    await unlink(join(process.cwd(), 'public', ref)).catch(() => {})
    return
  }
  await client().send(
    new DeleteObjectCommand({ Bucket: env.bucket.name, Key: ref }),
  )
}
