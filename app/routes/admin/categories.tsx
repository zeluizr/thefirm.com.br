import { Form } from 'react-router'

import { db } from '@server/lib/db'
import { requireAdmin } from '@server/lib/session'
import { slugify } from '@server/lib/slug'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import type { Route } from './+types/categories'

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request)
  const categories = await db.category.findMany({ orderBy: { name: 'asc' } })
  return { categories }
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request)
  const form = await request.formData()
  const intent = String(form.get('intent'))
  const id = String(form.get('id') ?? '')

  switch (intent) {
    case 'create': {
      const name = String(form.get('name') ?? '').trim()
      if (!name) return { error: 'nome obrigatório' }
      await db.category.create({ data: { name, slug: slugify(name) } })
      break
    }
    case 'toggle-enabled': {
      const cat = await db.category.findUnique({ where: { id } })
      if (cat) await db.category.update({ where: { id }, data: { enabled: !cat.enabled } })
      break
    }
    case 'toggle-video': {
      const cat = await db.category.findUnique({ where: { id } })
      if (cat)
        await db.category.update({ where: { id }, data: { videoEnabled: !cat.videoEnabled } })
      break
    }
    case 'save-hints':
      await db.category.update({
        where: { id },
        data: { promptHints: String(form.get('promptHints') ?? '') },
      })
      break
    case 'delete':
      await db.category.delete({ where: { id } })
      break
  }
  return { ok: true }
}

export default function AdminCategories({ loaderData }: Route.ComponentProps) {
  const { categories } = loaderData

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">categorias</h1>

      <Form method="post" className="brut flex flex-wrap items-end gap-3 p-4">
        <input type="hidden" name="intent" value="create" />
        <div className="flex flex-col gap-1">
          <Label htmlFor="new-cat">nova categoria</Label>
          <Input id="new-cat" name="name" placeholder="ex.: Linux" className="w-56" />
        </div>
        <Button type="submit">adicionar</Button>
      </Form>

      <ul className="flex flex-col gap-3">
        {categories.map((c) => (
          <li key={c.id} className="brut flex flex-col gap-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-bold">{c.name}</span>
                <span className="font-mono text-xs text-muted-foreground">/{c.slug}</span>
                <Badge variant={c.enabled ? 'default' : 'outline'}>
                  {c.enabled ? 'on' : 'off'}
                </Badge>
                <Badge variant={c.videoEnabled ? 'accent' : 'outline'}>
                  {c.videoEnabled ? 'vídeo on' : 'vídeo off'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Form method="post">
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="intent" value="toggle-enabled" />
                  <Button type="submit" size="sm" variant="outline">
                    {c.enabled ? 'desabilitar' : 'habilitar'}
                  </Button>
                </Form>
                <Form method="post">
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="intent" value="toggle-video" />
                  <Button type="submit" size="sm" variant="outline">
                    {c.videoEnabled ? 'vídeo off' : 'vídeo on'}
                  </Button>
                </Form>
                <Form method="post">
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="intent" value="delete" />
                  <Button type="submit" size="sm" variant="destructive">
                    remover
                  </Button>
                </Form>
              </div>
            </div>

            <Form method="post" className="flex flex-col gap-2">
              <input type="hidden" name="id" value={c.id} />
              <input type="hidden" name="intent" value="save-hints" />
              <Label htmlFor={`hints-${c.id}`}>dicas de prompt</Label>
              <Textarea
                id={`hints-${c.id}`}
                name="promptHints"
                defaultValue={c.promptHints ?? ''}
                rows={2}
              />
              <Button type="submit" size="sm" variant="outline" className="self-start">
                salvar dicas
              </Button>
            </Form>
          </li>
        ))}
      </ul>
    </div>
  )
}
