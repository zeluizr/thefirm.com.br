import { ArrowRight, PlusCircle } from 'lucide-react'
import { Link } from 'react-router'

import { ItemStatusBadge } from '~/components/admin/status-badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
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
import { dashboardCounts, listLogs, listMediaItems } from '~/services/media.server'

import type { Route } from './+types/admin._index'

export function meta(_: Route.MetaArgs) {
  return [{ title: 'the firm — dashboard' }]
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request)
  const [counts, items, logs] = await Promise.all([
    dashboardCounts(),
    listMediaItems(),
    listLogs(8),
  ])
  return { counts, items: items.slice(0, 6), logs }
}

const stats: { key: string; label: string }[] = [
  { key: 'total', label: 'Total' },
  { key: 'draft', label: 'Rascunhos' },
  { key: 'ready', label: 'Prontos' },
  { key: 'scheduled', label: 'Agendados' },
  { key: 'completed', label: 'Concluídos' },
  { key: 'failed', label: 'Falhas' },
]

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const { counts, items, logs } = loaderData

  return (
    <div className="grid gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Estado do estúdio editorial.</p>
        </div>
        <Button asChild>
          <Link to="/admin/media/new">
            <PlusCircle className="size-4" />
            Nova mídia
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 bp:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <Card key={s.key}>
            <CardContent className="p-4">
              <div className="font-mono text-[11px] uppercase tracking-[2px] text-muted-foreground">
                {s.label}
              </div>
              <div className="mt-1 font-display text-3xl tabular-nums">{counts[s.key] ?? 0}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Mídias recentes</CardTitle>
            <Link
              to="/admin/media"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              ver todas <ArrowRight className="size-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {items.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">Nenhuma mídia ainda.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden bp:table-cell">Agendado</TableHead>
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
                        <div className="font-mono text-[11px] text-muted-foreground">
                          {item.platforms.join(' · ') || 'sem plataformas'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <ItemStatusBadge status={item.status} />
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground bp:table-cell">
                        {item.publish_at ? formatDateTime(item.publish_at) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atividade</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem atividade.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="grid gap-0.5 border-l-2 border-border pl-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono uppercase tracking-wide">{log.action}</span>
                    {log.platform ? <span>· {log.platform}</span> : null}
                  </div>
                  <div className="text-sm">{log.message}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    {formatDateTime(log.created_at)}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
