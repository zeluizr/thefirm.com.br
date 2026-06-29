import { Form, Link, useNavigation } from 'react-router'

import { settingsOverview } from '@server/lib/config'
import { db } from '@server/lib/db'
import { requireAdmin } from '@server/lib/session'
import { forceDailyPost, runDailyPost } from '@server/pipeline/run'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardHeader, CardTitle } from '~/components/ui/card'
import type { Route } from './+types/index'

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request)
  const [byStatus, categories, blocklist, recent, fields] = await Promise.all([
    db.post.groupBy({ by: ['status'], _count: true }),
    db.category.count({ where: { enabled: true } }),
    db.blocklistTerm.count(),
    db.post.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { category: true },
    }),
    settingsOverview(),
  ])
  const counts: Record<string, number> = {}
  for (const row of byStatus) counts[row.status] = row._count
  const missing = fields.filter((f) => f.required && !f.set).map((f) => f.label)
  return { counts, categories, blocklist, recent, missing }
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request)
  const form = await request.formData()
  const intent = form.get('intent')
  const result = intent === 'force' ? await forceDailyPost() : await runDailyPost()
  return { result }
}

const STATUSES = ['PUBLISHED', 'PENDING_REVIEW', 'GENERATING_MEDIA', 'REJECTED'] as const

export default function AdminHome({ loaderData, actionData }: Route.ComponentProps) {
  const { counts, categories, blocklist, recent, missing } = loaderData
  const nav = useNavigation()
  const busy = nav.state !== 'idle'

  return (
    <div className="flex flex-col gap-8">
      {missing.length > 0 && (
        <section className="border-2 border-accent bg-accent/10 p-5">
          <h2 className="text-lg font-bold">⚡ falta configurar</h2>
          <p className="mt-1 text-sm">
            Pra rodar o pipeline, configure: <strong>{missing.join(', ')}</strong>.
          </p>
          <Link to="/admin/settings" className="contents">
            <Button className="mt-3" size="sm">
              abrir configuração →
            </Button>
          </Link>
        </section>
      )}

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {STATUSES.map((s) => (
          <Card key={s}>
            <CardHeader>
              <CardTitle className="text-3xl">{counts[s] ?? 0}</CardTitle>
              <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                {s.toLowerCase().replace('_', ' ')}
              </p>
            </CardHeader>
          </Card>
        ))}
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{categories}</CardTitle>
            <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              categorias on
            </p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{blocklist}</CardTitle>
            <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              blocklist
            </p>
          </CardHeader>
        </Card>
      </section>

      <section className="brut p-5">
        <h2 className="mb-1 text-lg font-bold">gerar post</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          o cron roda 1x/dia. aqui você dispara manualmente pra testar.
        </p>
        <div className="flex flex-wrap gap-3">
          <Form method="post">
            <input type="hidden" name="intent" value="daily" />
            <Button type="submit" disabled={busy}>
              gerar (respeita idempotência)
            </Button>
          </Form>
          <Form method="post">
            <input type="hidden" name="intent" value="force" />
            <Button type="submit" variant="outline" disabled={busy}>
              forçar agora
            </Button>
          </Form>
        </div>
        {actionData?.result && (
          <pre className="mt-4 overflow-x-auto border-2 border-border bg-card p-3 font-mono text-xs">
            {JSON.stringify(actionData.result, null, 2)}
          </pre>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">últimos posts</h2>
        <ul className="flex flex-col gap-2">
          {recent.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 border-2 border-border bg-card px-4 py-2"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Badge variant="secondary">{p.category.name}</Badge>
                <span className="truncate text-sm">{p.title}</span>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="font-mono text-[10px] uppercase text-muted-foreground">
                  {p.status.toLowerCase().replace('_', ' ')}
                </span>
                {p.status === 'PUBLISHED' && (
                  <Link
                    to={`/post/${p.slug}`}
                    className="text-xs font-bold uppercase underline"
                  >
                    ver
                  </Link>
                )}
              </div>
            </li>
          ))}
          {recent.length === 0 && (
            <li className="border-2 border-border bg-card px-4 py-6 text-center font-mono text-sm text-muted-foreground">
              ainda nada gerado.
            </li>
          )}
        </ul>
      </section>
    </div>
  )
}
