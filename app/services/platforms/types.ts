import type { Platform } from '../types'

// The single input shape every adapter accepts (per the spec).
export interface PublishInput {
  caption: string
  mediaUrl: string
  mediaType: 'image' | 'video'
  slug: string
}

export interface PublishResult {
  remotePostId: string
  permalink?: string
  raw?: unknown
}

export interface PublishOptions {
  // When true the adapter must NOT hit the network — it returns a mock result.
  dryRun?: boolean
}

export interface PlatformAdapter {
  platform: Platform
  publishMedia(input: PublishInput, opts?: PublishOptions): Promise<PublishResult>
}

// Thrown when required tokens are absent. The publisher maps this to the
// `skipped` platform status (a configuration gap, not a real failure).
export class MissingCredentialsError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MissingCredentialsError'
  }
}
