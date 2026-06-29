import { Form } from 'react-router'

import { db } from '@server/lib/db'
import { requireAdmin } from '@server/lib/session'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import type { Route } from './+types/blocklist'

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request)
  const terms = await db.blocklistTerm.findMany({ orderBy: { createdAt: 'desc' } })
  return { terms }
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request)
  const form = await request.formData()
  const intent = String(form.get('intent'))

  if (intent === 'add') {
    const value = String(form.get('value') ?? '').trim()
    const kind = String(form.get('kind') ?? 'term')
    if (!value) return { error: 'valor obrigatório' }
    await db.blocklistTerm.upsert({
      where: { value },
      update: { kind },
      create: { value, kind },
    })
  } else if (intent === 'remove') {
    await db.blocklistTerm.delete({ where: { id: String(form.get('id')) } })
  }
  return { ok: true }
}

export default function AdminBlocklist({ loaderData }: Route.ComponentProps) {
  const { terms } = loaderData

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">blocklist</h1>
      <p className="text-sm text-muted-foreground">
        termos e temas proibidos. injetados como restrição negativa no gerador e no
        classificador de moderação.
      </p>

      <Form method="post" className="brut flex flex-wrap items-end gap-3 p-4">
        <input type="hidden" name="intent" value="add" />
        <div className="flex flex-col gap-1">
          <Label htmlFor="value">termo / tema</Label>
          <Input id="value" name="value" placeholder="ex.: política partidária" className="w-64" />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="kind">tipo</Label>
          <select
            id="kind"
            name="kind"
            className="h-10 border-2 border-input bg-background px-2 text-sm"
          >
            <option value="term">term</option>
            <option value="theme">theme</option>
          </select>
        </div>
        <Button type="submit">adicionar</Button>
      </Form>

      <ul className="flex flex-wrap gap-2">
        {terms.map((t) => (
          <li key={t.id} className="flex items-center gap-2 border-2 border-border bg-card px-3 py-1.5">
            <Badge variant={t.kind === 'theme' ? 'accent' : 'secondary'}>{t.kind}</Badge>
            <span className="text-sm">{t.value}</span>
            <Form method="post">
              <input type="hidden" name="id" value={t.id} />
              <input type="hidden" name="intent" value="remove" />
              <button
                type="submit"
                className="font-mono text-sm font-bold text-destructive"
                aria-label="remover"
              >
                ×
              </button>
            </Form>
          </li>
        ))}
        {terms.length === 0 && (
          <li className="font-mono text-sm text-muted-foreground">blocklist vazia.</li>
        )}
      </ul>
    </div>
  )
}
