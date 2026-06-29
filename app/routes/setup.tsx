import { Link } from 'react-router'

import { bootstrapComplete, bootstrapOverview } from '@server/lib/config'
import { Badge } from '~/components/ui/badge'
import type { Route } from './+types/setup'

export async function loader(_: Route.LoaderArgs) {
  return { fields: bootstrapOverview(), complete: bootstrapComplete() }
}

export function meta(_: Route.MetaArgs) {
  return [{ title: 'setup · the firm' }]
}

export default function Setup({ loaderData }: Route.ComponentProps) {
  const { fields, complete } = loaderData

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-8 px-6 py-12">
      <header>
        <h1 className="font-mono text-2xl font-bold tracking-tighter">
          the firm<span className="text-spark">.</span>setup
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Estes valores ficam no <strong>.env</strong> (ou nas variables do Railway) — são
          necessários antes do login, então não dá pra guardá-los no banco. Gere/cole uma vez e
          esqueça. O resto (Gemini, Telegram, cron) você configura depois em{' '}
          <code className="border border-border bg-secondary px-1">/admin/settings</code>.
        </p>
      </header>

      <div
        className={`border-2 p-4 text-sm font-bold ${
          complete ? 'border-border bg-secondary' : 'border-destructive bg-destructive/10'
        }`}
      >
        {complete
          ? 'bootstrap completo ✓ — já dá pra entrar no /admin'
          : 'bootstrap incompleto — preencha os itens marcados abaixo'}
      </div>

      <div className="brut p-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide">gerar segredos</p>
        <pre className="overflow-x-auto border-2 border-border bg-card p-3 font-mono text-xs">
          {`BETTER_AUTH_SECRET   → openssl rand -base64 32
CONFIG_ENCRYPTION_KEY → openssl rand -hex 32`}
        </pre>
      </div>

      <ol className="flex flex-col gap-4">
        {fields.map((f, i) => (
          <li key={f.key} className="brut flex flex-col gap-2 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="font-bold">{f.label}</span>
              <code className="border border-border bg-secondary px-1 font-mono text-xs">
                {f.key}
              </code>
              {f.set ? (
                <Badge variant="default">definido</Badge>
              ) : (
                <Badge variant="destructive">faltando</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{f.help}</p>
            {f.links && f.links.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {f.links.map((l) => (
                  <a
                    key={l.url}
                    href={l.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-xs font-bold uppercase tracking-wide underline"
                  >
                    {l.label} →
                  </a>
                ))}
              </div>
            )}
          </li>
        ))}
      </ol>

      <div className="flex gap-4">
        <Link to="/login" className="font-bold uppercase tracking-wide underline">
          ir pro login →
        </Link>
        <Link to="/" className="font-bold uppercase tracking-wide underline text-muted-foreground">
          ← site
        </Link>
      </div>
    </main>
  )
}
