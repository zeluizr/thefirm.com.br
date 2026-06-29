import { mkdir, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'

import { env } from './env'

// armazenamento simples em disco (use um Railway Volume montado em MEDIA_DIR).
// pra trocar por bucket (R2/S3), reimplemente saveMedia/mediaTarget mantendo as assinaturas.

const EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
}

function extFor(mimeType: string): string {
  return EXT[mimeType] ?? mimeType.split('/')[1] ?? 'bin'
}

export async function ensureMediaDir(): Promise<string> {
  await mkdir(env.MEDIA_DIR, { recursive: true })
  return env.MEDIA_DIR
}

// caminho local em disco correspondente a uma mediaUrl (pra enviar bytes ao Telegram
// em vez de URL — Telegram não alcança localhost e dispensa URL pública em prod)
export function localMediaPath(url: string): string {
  const name = basename(new URL(url, env.APP_URL).pathname)
  return join(env.MEDIA_DIR, name)
}

// URL pública absoluta (sob APP_URL) de um arquivo já salvo em MEDIA_DIR
export function mediaUrl(filename: string): string {
  const publicPath = `${env.MEDIA_PUBLIC_PATH.replace(/\/$/, '')}/${filename}`
  return `${env.APP_URL.replace(/\/$/, '')}${publicPath}`
}

// caminho absoluto em disco onde gravar/baixar um arquivo
export async function mediaTarget(filename: string): Promise<{ path: string; url: string }> {
  const dir = await ensureMediaDir()
  return { path: join(dir, filename), url: mediaUrl(filename) }
}

// grava os bytes e devolve a URL pública absoluta
export async function saveMedia(
  bytes: Buffer,
  mimeType: string,
  basename: string,
): Promise<string> {
  const filename = `${basename}.${extFor(mimeType)}`
  const { path, url } = await mediaTarget(filename)
  await writeFile(path, bytes)
  return url
}

export async function saveBase64(
  base64: string,
  mimeType: string,
  basename: string,
): Promise<string> {
  return saveMedia(Buffer.from(base64, 'base64'), mimeType, basename)
}
