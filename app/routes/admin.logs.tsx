import { Link } from 'react-router'

import { Badge } from '~/components/ui/badge'
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
import { listLogs } from '~/services/media.server'

import type { Route } from './+types/admin.logs'

export function meta(_: Route.MetaArgs) {
  return [{ title: 'the firm — logs' }]
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request)
  return { logs: await listLogs(200) }
}

const statusVariant: Record<string, 'success' | 'destructive' | 'warning' | 'muted'> = {
  success: 'success',
  error: 'destructive',
  skipped: 'warning',
  info: 'muted',
}

export default function Logs({ loaderData }: Route.ComponentProps) {
  const { logs } = loaderData

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-display text-2xl uppercase tracking-tight">Logs</h1>
        <p className="text-sm text-muted-foreground">Histórico de publicações e atividade.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <p className="p-12 text-center text-sm text-muted-foreground">Sem logs ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-44">Quando</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead className="hidden bp:table-cell">Plataforma</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Mensagem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                      {formatDateTime(log.created_at)}
                    </TableCell>
                    <TableCell className="font-mono text-xs uppercase tracking-wide">
                      {log.action}
                    </TableCell>
                    <TableCell className="hidden bp:table-cell">
                      {log.platform ? (
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          {log.platform}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[log.status] ?? 'muted'}>{log.status}</Badge>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <span className="text-sm">{log.message}</span>
                      {log.media_item_id ? (
                        <Link
                          to={`/admin/media/${log.media_item_id}`}
                          className="ml-2 text-xs text-primary hover:underline"
                        >
                          ver
                        </Link>
                      ) : null}
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
