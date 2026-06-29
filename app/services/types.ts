// Domain types shared by server services and the React UI.
// (Type-only module — safe to import from client components.)

export type Platform = 'x' | 'instagram' | 'facebook' | 'threads'
export type MediaType = 'image' | 'video'

export type ItemStatus =
  | 'draft'
  | 'ready'
  | 'scheduled'
  | 'publishing'
  | 'completed'
  | 'failed'

export type PlatformStatus =
  | 'pending'
  | 'publishing'
  | 'published'
  | 'failed'
  | 'skipped'

export interface MediaItem {
  id: string
  slug: string
  title: string
  caption: string
  media_url: string
  media_type: MediaType
  platforms: Platform[]
  publish_at: string | null
  persona: string
  status: ItemStatus
  retain_media_after_publish: boolean
  created_at: string
  updated_at: string
}

export interface PlatformPublication {
  id: string
  media_item_id: string
  platform: Platform
  status: PlatformStatus
  remote_post_id: string | null
  permalink: string | null
  error: string | null
  attempts: number
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface PublishLog {
  id: string
  media_item_id: string | null
  platform: Platform | null
  action: string
  status: string
  message: string
  created_at: string
}

export const ALL_PLATFORMS: Platform[] = ['x', 'instagram', 'facebook', 'threads']

export const PLATFORM_LABELS: Record<Platform, string> = {
  x: 'X / Twitter',
  instagram: 'Instagram',
  facebook: 'Facebook Page',
  threads: 'Threads',
}

export const DEFAULT_PERSONA = 'O Outro José'
