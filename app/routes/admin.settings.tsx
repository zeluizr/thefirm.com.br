import { CheckCircle2, XCircle } from 'lucide-react'

import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { requireUser } from '~/services/auth.server'
import { env, isStorageConfigured } from '~/services/env.server'
import { PLATFORM_LABELS, type Platform } from '~/services/types'

import type { Route } from './+types/admin.settings'

export function meta(_: Route.MetaArgs) {
  return [{ title: 'the firm — configurações' }]
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request)
  return {
    dryRun: env.DRY_RUN,
    timezone: env.DEFAULT_TIMEZONE,
    appUrl: env.APP_URL,
    adminEmail: env.ADMIN_EMAIL || '(não definido)',
    storage: isStorageConfigured(),
    platforms: {
      x: Boolean(env.x.apiKey && env.x.apiSecret && env.x.accessToken && env.x.accessTokenSecret),
      instagram: Boolean(env.meta.accessToken && env.meta.instagramBusinessAccountId),
      facebook: Boolean(env.meta.accessToken && env.meta.facebookPageId),
      threads: Boolean(env.threads.accessToken && env.threads.userId),
    } as Record<Platform, boolean>,
    envHints: {
      x: 'X_API_KEY · X_API_SECRET · X_ACCESS_TOKEN · X_ACCESS_TOKEN_SECRET',
      instagram: 'META_ACCESS_TOKEN · INSTAGRAM_BUSINESS_ACCOUNT_ID',
      facebook: 'META_ACCESS_TOKEN · FACEBOOK_PAGE_ID',
      threads: 'THREADS_ACCESS_TOKEN · THREADS_USER_ID',
    } as Record<Platform, string>,
  }
}

function StatusPill({ ok }: { ok: boolean }) {
  return ok ? (
    <Badge variant="success" className="gap-1">
      <CheckCircle2 className="size-3" /> configurado
    </Badge>
  ) : (
    <Badge variant="muted" className="gap-1">
      <XCircle className="size-3" /> faltando tokens
    </Badge>
  )
}

export default function Settings({ loaderData }: Route.ComponentProps) {
  const d = loaderData
  const order: Platform[] = ['x', 'instagram', 'facebook', 'threads']

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <div>
        <h1 className="font-display text-2xl uppercase tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Somente leitura — tudo vem das variáveis de ambiente (configure na Railway).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Geral</CardTitle>
          <CardDescription>Comportamento do estúdio.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <Row label="Modo">
            {d.dryRun ? (
              <Badge variant="warning">DRY_RUN — simulação</Badge>
            ) : (
              <Badge variant="success">AO VIVO — publica de verdade</Badge>
            )}
          </Row>
          <Row label="Fuso horário">
            <span className="font-mono text-muted-foreground">{d.timezone}</span>
          </Row>
          <Row label="URL pública">
            <span className="font-mono text-muted-foreground">{d.appUrl}</span>
          </Row>
          <Row label="E-mail admin">
            <span className="font-mono text-muted-foreground">{d.adminEmail}</span>
          </Row>
          <Row label="Armazenamento">
            {d.storage ? (
              <Badge variant="success">Railway bucket</Badge>
            ) : (
              <Badge variant="muted">local (public/uploads)</Badge>
            )}
          </Row>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plataformas</CardTitle>
          <CardDescription>
            Sem tokens, a plataforma é marcada como <code className="text-foreground">skipped</code>{' '}
            na publicação.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {order.map((p) => (
            <div
              key={p}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
            >
              <div>
                <div className="text-sm font-medium">{PLATFORM_LABELS[p]}</div>
                <div className="font-mono text-[11px] text-muted-foreground">{d.envHints[p]}</div>
              </div>
              <StatusPill ok={d.platforms[p]} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}
