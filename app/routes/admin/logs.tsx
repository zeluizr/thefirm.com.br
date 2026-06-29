import { db } from '@server/lib/db'
import { requireAdmin } from '@server/lib/session'
import { Badge } from '~/components/ui/badge'
import type { Route } from './+types/logs'

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request)
  const [generation, moderation] = await Promise.all([
    db.generationLog.findMany({ orderBy: { createdAt: 'desc' }, take: 40 }),
    db.moderationLog.findMany({ orderBy: { createdAt: 'desc' }, take: 40 }),
  ])
  return { generation, moderation }
}

function fmt(d: Date | string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(d),
  )
}

export default function AdminLogs({ loaderData }: Route.ComponentProps) {
  const { generation, moderation } = loaderData

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold">logs de moderação</h1>
        <ul className="flex flex-col gap-2">
          {moderation.map((m) => (
            <li key={m.id} className="border-2 border-border bg-card p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant={m.passed ? 'default' : 'destructive'}>
                    {m.passed ? 'passou' : 'reprovou'}
                  </Badge>
                  <span className="font-mono text-xs">{m.provider}</span>
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {fmt(m.createdAt)}
                </span>
              </div>
              <pre className="mt-2 overflow-x-auto font-mono text-[10px] text-muted-foreground">
                {JSON.stringify(m.scores, null, 2)}
              </pre>
            </li>
          ))}
          {moderation.length === 0 && (
            <li className="font-mono text-sm text-muted-foreground">sem logs.</li>
          )}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-bold">logs de geração</h2>
        <ul className="flex flex-col gap-2">
          {generation.map((g) => (
            <li key={g.id} className="border-2 border-border bg-card p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{g.category}</Badge>
                  <span className="font-mono text-xs text-muted-foreground">
                    {g.model} · {g.version}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {fmt(g.createdAt)}
                </span>
              </div>
              <pre className="mt-2 max-h-40 overflow-auto font-mono text-[10px] text-muted-foreground">
                {g.rawOutput}
              </pre>
            </li>
          ))}
          {generation.length === 0 && (
            <li className="font-mono text-sm text-muted-foreground">sem logs.</li>
          )}
        </ul>
      </section>
    </div>
  )
}
