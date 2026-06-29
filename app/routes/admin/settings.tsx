import { Form, useNavigation } from 'react-router'

import {
  deleteSetting,
  settingsOverview,
  setSetting,
  type FieldStatus,
} from '@server/lib/config'
import { SETTINGS_GROUPS, SETTINGS_SPEC } from '@server/lib/config-spec'
import { encryptionAvailable, randomSecret } from '@server/lib/crypto'
import { requireAdmin } from '@server/lib/session'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import type { Route } from './+types/settings'

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request)
  const fields = await settingsOverview()
  return { fields, canEncrypt: encryptionAvailable() }
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request)
  if (!encryptionAvailable()) {
    return { error: 'CONFIG_ENCRYPTION_KEY ausente no env — não dá pra salvar. Veja /setup.' }
  }

  const form = await request.formData()
  const intent = String(form.get('intent') ?? '')

  try {
    if (intent.startsWith('generate:')) {
      await setSetting(intent.slice('generate:'.length), randomSecret())
    } else if (intent.startsWith('clear:')) {
      await deleteSetting(intent.slice('clear:'.length))
    } else if (intent === 'save') {
      for (const f of SETTINGS_SPEC) {
        const value = String(form.get(f.key) ?? '').trim()
        if (f.secret) {
          // segredo: em branco mantém o valor atual
          if (value) await setSetting(f.key, value)
        } else if (value) {
          await setSetting(f.key, value)
        } else {
          // não-secret vazio: limpa (volta pro env/default)
          await deleteSetting(f.key)
        }
      }
    }
    return { ok: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

function SourceBadge({ field }: { field: FieldStatus }) {
  if (field.source === 'db') return <Badge variant="default">salvo no banco</Badge>
  if (field.source === 'env') return <Badge variant="secondary">via env</Badge>
  return <Badge variant="outline">vazio</Badge>
}

export default function AdminSettings({ loaderData, actionData }: Route.ComponentProps) {
  const { fields, canEncrypt } = loaderData
  const nav = useNavigation()
  const busy = nav.state !== 'idle'

  const byKey = new Map(fields.map((f) => [f.key, f]))
  let step = 0

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">configuração</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          chaves operacionais, cifradas no banco. o banco tem prioridade sobre o env. segredos
          ficam mascarados — deixe em branco pra manter o valor atual.
        </p>
      </div>

      {!canEncrypt && (
        <div className="border-2 border-destructive bg-destructive/10 p-4">
          <p className="text-sm font-bold">CONFIG_ENCRYPTION_KEY não está no env.</p>
          <p className="mt-1 text-sm">
            Sem ela não dá pra cifrar segredos no banco. Gere com{' '}
            <code className="border border-border bg-secondary px-1">openssl rand -hex 32</code> e
            coloque no env (veja <a className="font-bold underline" href="/setup">/setup</a>).
          </p>
        </div>
      )}

      {actionData?.error && (
        <div className="border-2 border-destructive bg-destructive/10 p-3 text-sm font-bold">
          {actionData.error}
        </div>
      )}
      {actionData && 'ok' in actionData && actionData.ok && (
        <div className="border-2 border-border bg-secondary p-3 text-sm font-bold">salvo ✓</div>
      )}

      <Form method="post" className="flex flex-col gap-8">
        {SETTINGS_GROUPS.map((group) => (
          <section key={group} className="brut p-5">
            <h2 className="mb-4 text-lg font-bold">{group}</h2>
            <div className="flex flex-col gap-6">
              {SETTINGS_SPEC.filter((f) => f.group === group).map((spec) => {
                const field = byKey.get(spec.key)!
                step += 1
                return (
                  <div key={spec.key} className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        {String(step).padStart(2, '0')}
                      </span>
                      <Label htmlFor={spec.key}>{spec.label}</Label>
                      {spec.required && <Badge variant="accent">obrigatório</Badge>}
                      <SourceBadge field={field} />
                    </div>

                    <p className="text-sm text-muted-foreground">{spec.help}</p>

                    {spec.links && spec.links.length > 0 && (
                      <div className="flex flex-wrap gap-3">
                        {spec.links.map((l) => (
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

                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        id={spec.key}
                        name={spec.key}
                        type={spec.secret ? 'password' : 'text'}
                        defaultValue={field.value}
                        placeholder={
                          spec.secret && field.set
                            ? `configurado (${field.preview}) — em branco mantém`
                            : (spec.placeholder ?? spec.default ?? '')
                        }
                        autoComplete="off"
                        className="max-w-md flex-1"
                      />
                      {spec.generate && (
                        <Button
                          type="submit"
                          name="intent"
                          value={`generate:${spec.key}`}
                          variant="outline"
                          size="sm"
                          disabled={busy || !canEncrypt}
                        >
                          gerar
                        </Button>
                      )}
                      {spec.secret && field.source === 'db' && (
                        <Button
                          type="submit"
                          name="intent"
                          value={`clear:${spec.key}`}
                          variant="outline"
                          size="sm"
                          disabled={busy}
                        >
                          limpar
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ))}

        <div className="sticky bottom-4">
          <Button
            type="submit"
            name="intent"
            value="save"
            size="lg"
            disabled={busy || !canEncrypt}
          >
            salvar tudo
          </Button>
        </div>
      </Form>
    </div>
  )
}
