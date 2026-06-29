import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

import { env } from './env'

// AES-256-GCM. A chave de 32 bytes é derivada de CONFIG_ENCRYPTION_KEY via sha256,
// então qualquer string aleatória serve (gere com: openssl rand -hex 32).
// Formato do token: base64( iv(12) || authTag(16) || ciphertext ).

function masterKey(): Buffer | null {
  const raw = env.CONFIG_ENCRYPTION_KEY
  if (!raw) return null
  return createHash('sha256').update(raw).digest()
}

export function encryptionAvailable(): boolean {
  return masterKey() !== null
}

export function encrypt(plain: string): string {
  const key = masterKey()
  if (!key) throw new Error('CONFIG_ENCRYPTION_KEY ausente — não dá pra cifrar settings')
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString('base64')
}

export function decrypt(token: string): string {
  const key = masterKey()
  if (!key) throw new Error('CONFIG_ENCRYPTION_KEY ausente — não dá pra decifrar settings')
  const buf = Buffer.from(token, 'base64')
  const iv = buf.subarray(0, 12)
  const tag = buf.subarray(12, 28)
  const enc = buf.subarray(28)
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
}

// gera um segredo aleatório forte (pra webhook/cron secret)
export function randomSecret(bytes = 24): string {
  return randomBytes(bytes).toString('base64url')
}
