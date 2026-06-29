import { Badge } from '~/components/ui/badge'
import { itemStatusVariant, platformStatusVariant } from '~/lib/format'
import type { ItemStatus, PlatformStatus } from '~/services/types'

export function ItemStatusBadge({ status }: { status: ItemStatus }) {
  return <Badge variant={itemStatusVariant[status]}>{status}</Badge>
}

export function PlatformStatusBadge({ status }: { status: PlatformStatus }) {
  return <Badge variant={platformStatusVariant[status]}>{status}</Badge>
}
