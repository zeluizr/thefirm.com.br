import type { Platform } from '../types'
import { facebookAdapter } from './facebook.server'
import { instagramAdapter } from './instagram.server'
import { threadsAdapter } from './threads.server'
import type { PlatformAdapter } from './types'
import { xAdapter } from './x.server'

export const adapters: Record<Platform, PlatformAdapter> = {
  x: xAdapter,
  instagram: instagramAdapter,
  facebook: facebookAdapter,
  threads: threadsAdapter,
}

export type { PlatformAdapter, PublishInput, PublishResult } from './types'
export { MissingCredentialsError } from './types'
