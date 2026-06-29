import type { ItemStatus, PlatformStatus } from '~/services/types'

type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'outline'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'muted'

// Normalises a Postgres timestamp string ("2026-06-29 12:00:00+00") to a Date.
export function toDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const iso = value.includes('T') ? value : value.replace(' ', 'T').replace(/([+-]\d\d)$/, '$1:00')
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

export function formatDateTime(value: string | null | undefined): string {
  const d = toDate(value)
  if (!d) return '—'
  return d.toLocaleString('pt-BR', { dateStyle: 'medium', timeStyle: 'short' })
}

export function formatDate(value: string | null | undefined): string {
  const d = toDate(value)
  if (!d) return '—'
  return d.toLocaleDateString('pt-BR', { dateStyle: 'medium' })
}

// Value for a <input type="datetime-local"> (local wall-clock, no seconds).
export function toDateTimeLocal(value: string | null | undefined): string {
  const d = toDate(value)
  if (!d) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// datetime-local string → ISO for storage. Empty → null.
export function dateTimeLocalToISO(value: string | null | undefined): string | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

export const itemStatusVariant: Record<ItemStatus, BadgeVariant> = {
  draft: 'muted',
  ready: 'default',
  scheduled: 'warning',
  publishing: 'default',
  completed: 'success',
  failed: 'destructive',
}

export const platformStatusVariant: Record<PlatformStatus, BadgeVariant> = {
  pending: 'muted',
  publishing: 'default',
  published: 'success',
  failed: 'destructive',
  skipped: 'warning',
}
