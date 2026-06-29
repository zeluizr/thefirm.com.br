import { ArrowLeft } from 'lucide-react'
import { Form, Link, redirect, useNavigation } from 'react-router'

import { MediaFields } from '~/components/admin/media-fields'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { dateTimeLocalToISO } from '~/lib/format'
import { requireUser } from '~/services/auth.server'
import { createMediaItem, setItemStatus, setMediaUrl } from '~/services/media.server'
import { uploadMedia } from '~/services/storage.server'
import { ALL_PLATFORMS, DEFAULT_PERSONA, type MediaType, type Platform } from '~/services/types'

import type { Route } from './+types/admin.media.new'

export function meta(_: Route.MetaArgs) {
  return [{ title: 'the firm — nova mídia' }]
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request)
  return null
}

export async function action({ request }: Route.ActionArgs) {
  await requireUser(request)
  const form = await request.formData()

  const title = String(form.get('title') ?? '').trim()
  if (!title) return { error: 'Título é obrigatório.' }

  const intent = String(form.get('intent') ?? 'draft')
  const caption = String(form.get('caption') ?? '')
  const mediaType: MediaType = form.get('mediaType') === 'video' ? 'video' : 'image'
  const platforms = form
    .getAll('platforms')
    .map(String)
    .filter((p): p is Platform => (ALL_PLATFORMS as string[]).includes(p))
  const persona = String(form.get('persona') ?? DEFAULT_PERSONA) || DEFAULT_PERSONA
  const publishAt = dateTimeLocalToISO(String(form.get('publishAt') ?? ''))
  const retain = form.get('retain') === 'on'
  const externalUrl = String(form.get('mediaUrl') ?? '').trim()

  const item = await createMediaItem({
    title,
    caption,
    mediaType,
    platforms,
    persona,
    publishAt,
    retainMediaAfterPublish: retain,
  })

  // Upload takes priority over a pasted external URL.
  const file = form.get('media')
  let mediaUrl = externalUrl
  if (file instanceof File && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer())
    mediaUrl = await uploadMedia({
      buffer,
      filename: file.name,
      contentType: file.type || 'application/octet-stream',
      slug: item.slug,
    })
  }
  if (mediaUrl) await setMediaUrl(item.id, mediaUrl)

  if (intent === 'ready') {
    await setItemStatus(item.id, publishAt ? 'scheduled' : 'ready')
  } else if (publishAt) {
    await setItemStatus(item.id, 'scheduled')
  }

  return redirect(`/admin/media/${item.id}`)
}

export default function NewMedia({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation()
  const busy = navigation.state !== 'idle'

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <div>
        <Link
          to="/admin/media"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Mídias
        </Link>
        <h1 className="mt-2 font-display text-2xl uppercase tracking-tight">Nova mídia</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Form method="post" encType="multipart/form-data" className="grid gap-6">
            <MediaFields />

            <div className="grid gap-3 rounded-lg border border-dashed border-border p-4">
              <div className="grid gap-2">
                <Label htmlFor="media">Arquivo (imagem ou vídeo)</Label>
                <Input id="media" name="media" type="file" accept="image/*,video/*" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mediaUrl">…ou URL pública da mídia</Label>
                <Input
                  id="mediaUrl"
                  name="mediaUrl"
                  type="url"
                  placeholder="https://…"
                />
                <p className="text-xs text-muted-foreground">
                  Se enviar um arquivo, ele tem prioridade sobre a URL.
                </p>
              </div>
            </div>

            {actionData?.error ? (
              <p className="text-sm text-destructive">{actionData.error}</p>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button type="submit" name="intent" value="draft" variant="secondary" disabled={busy}>
                Salvar rascunho
              </Button>
              <Button type="submit" name="intent" value="ready" disabled={busy}>
                Salvar e marcar pronto
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
