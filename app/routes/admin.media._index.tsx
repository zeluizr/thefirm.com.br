import { PlusCircle } from 'lucide-react'
import { Link } from 'react-router'

import { ItemStatusBadge } from '~/components/admin/status-badge'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { formatDateTime } from '~/lib/format'
import { requireUser } from '~/services/auth.server'
import { listMediaItems } from '~/services/media.server'

import type { Route } from './+types/admin.media._index'

export function meta(_: Route.MetaArgs) {
  return [{ title: 'the firm — mídias' }]
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request)
  return { items: await listMediaItems() }
}

export default function MediaList({ loaderData }: Route.ComponentProps) {
  const { items } = loaderData

  return (
    <div className="grid gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-tight">Mídias</h1>
          <p className="text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? 'item' : 'itens'} no estúdio.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/media/new">
            <PlusCircle className="size-4" />
            Nova mídia
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhuma mídia ainda. Crie a primeira.
              </p>
              <Button asChild className="mt-4">
                <Link to="/admin/media/new">Criar mídia</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Plataformas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden bp:table-cell">Agendado</TableHead>
                  <TableHead className="hidden bp:table-cell">Criado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Link
                        to={`/admin/media/${item.id}`}
                        className="font-medium hover:text-primary"
                      >
                        {item.title}
                      </Link>
                      <div className="font-mono text-[11px] text-muted-foreground">{item.slug}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.media_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {item.platforms.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          item.platforms.map((p) => (
                            <Badge key={p} variant="secondary" className="font-mono text-[10px]">
                              {p}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <ItemStatusBadge status={item.status} />
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground bp:table-cell">
                      {item.publish_at ? formatDateTime(item.publish_at) : '—'}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground bp:table-cell">
                      {formatDateTime(item.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
