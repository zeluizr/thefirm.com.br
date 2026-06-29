import type { MediaType, Platform } from '~/services/types'

export interface FotologPostLink {
  platform: Platform
  permalink: string
}

export interface FotologPost {
  id: string
  slug: string
  title: string
  caption: string
  mediaType: MediaType
  thumb: string
  createdAt: string
  index: number // sequential fotolog number (newest = highest)
  links: FotologPostLink[]
}
