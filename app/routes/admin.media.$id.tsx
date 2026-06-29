import { ArrowLeft, ExternalLink, Rocket, Trash2 } from 'lucide-react'
import { useEffect } from 'react'
import { Form, Link, redirect, useNavigation } from 'react-router'
import { toast } from 'sonner'

import { MediaFields } from '~/components/admin/media-fields'
import { ItemStatusBadge, PlatformStatusBadge } from '~/components/admin/status-badge'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { dateTimeLocalToISO, formatDateTime } from '~/lib/format'
import { requireUser } from '~/services/auth.server'
import {
  addLog,
  deleteMediaItem,
  getMediaItem,
  listLogsForItem,
  listPublications,
  prunePublications,
  setItemStatus,
  setMediaUrl,
  updateMediaItem,
} from '~/services/media.server'
import { processMediaItem } from '~/services/publisher.server'
import { deleteMedia, previewUrl, uploadMedia } from '~/services/storage.server'
import {
  ALL_PLATFORMS,
  DEFAULT_PERSONA,
  PLATFORM_LABELS,
  type MediaType,
  type Platform,
  type PlatformPublication,
} from '~/services/types'

import type { Route } from './+types/admin.media.$id'

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data ? `the firm — ${data.item.title}` : 'the firm — mídia' }]
}

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireUser(request)
  const item = await getMediaItem(params.id)
  if (!item) throw new Response('Not found', { status: 404 })
  const [publications, logs] = await Promise.all([
    listPublications(item.id),
    listLogsForItem(item.id),
  ])
  const preview = item.media_url ? await previewUrl(item.media_url) : ''
  return { item, publications, logs, preview }
}

function parsePlatforms(form: FormData): Platform[] {
  return form
    .getAll('platforms')
    .map(String)
    .filter((p): p is Platform => (ALL_PLATFORMS as string[]).includes(p))
}

export async function action({ request, params }: Route.ActionArgs) {
  await requireUser(request)
  const item = await getMediaItem(params.id)
  if (!item) throw new Response('Not found', { status: 404 })

  const form = await request.formData()
  const intent = String(form.get('intent') ?? '')

  if (intent === 'update') {
    const title = String(form.get('title') ?? '').trim()
    if (!title) return { error: 'Título é obrigatório.' }
    const platforms = parsePlatforms(form)
    const publishAt = dateTimeLocalToISO(String(form.get('publishAt') ?? ''))

    await updateMediaItem(item.id, {
      title,
      caption: String(form.get('caption') ?? ''),
      mediaType: form.get('mediaType') === 'video' ? 'video' : ('image' as MediaType),
      platforms,
      persona: String(form.get('persona') ?? DEFAULT_PERSONA) || DEFAULT_PERSONA,
      publishAt,
      retainMediaAfterPublish: form.get('retain') === 'on',
    })
    await prunePublications(item.id, platforms)

    const file = form.get('media')
    if (file instanceof File && file.size > 0) {
      if (item.media_url) await deleteMedia(item.media_url).catch(() => {})
      const buffer = Buffer.from(await file.arrayBuffer())
      const mediaUrl = await uploadMedia({
        buffer,
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        slug: item.slug,
      })
      await setMediaUrl(item.id, mediaUrl)
    } else {
      const externalUrl = String(form.get('mediaUrl') ?? '').trim()
      if (externalUrl) await setMediaUrl(item.id, externalUrl)
    }
    return { ok: true, message: 'Mídia atualizada.' }
  }

  if (intent === 'ready') {
    const status = item.publish_at ? 'scheduled' : 'ready'
    await setItemStatus(item.id, status)
    await addLog({ mediaItemId: item.id, action: 'ready', status: 'info', message: `Marcada como ${status}` })
    return { ok: true, message: `Marcada como ${status}.` }
  }

  if (intent === 'publish-now') {
    const result = await processMediaItem(item.id, { trigger: 'publish' })
    return { ok: true, message: `Publicação concluída: ${result.finalStatus}.`, result }
  }

  if (intent === 'dry-run') {
    const result = await processMediaItem(item.id, { dryRun: true, trigger: 'dry-run' })
    return { ok: true, dryRun: true, message: 'Dry-run concluído (nada foi publicado).', result }
  }

  if (intent === 'delete') {
    if (item.media_url) await deleteMedia(item.media_url).catch(() => {})
    await deleteMediaItem(item.id)
    return redirect('/admin/media')
  }

  return { error: 'Ação desconhecida.' }
}

export default function MediaDetail({ loaderData, actionData }: Route.ComponentProps) {
  const { item, publications, logs, preview } = loaderData
  const navigation = useNavigation()
  const busy = navigation.state !== 'idle'

  useEffect(() => {
    if (!actionData) return
    if ('error' in actionData && actionData.error) toast.error(actionData.error)
    else if ('message' in actionData && actionData.message) toast.success(actionData.message)
  }, [actionData])

  const pubByPlatform = new Map<Platform, PlatformPublication>(
    publications.map((p) => [p.platform, p]),
  )
  const result = actionData && 'result' in actionData ? actionData.result : null

  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <div>
        <Link
          to="/admin/media"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Mídias
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl uppercase tracking-tight">{item.title}</h1>
            <div className="font-mono text-xs text-muted-foreground">
              {item.slug} · {item.persona}
            </div>
          </div>
          <ItemStatusBadge status={item.status} />
        </div>
      </div>

      {/* action bar */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 py-4">
          <Form method="post">
            <Button
              type="submit"
              name="intent"
              value="ready"
              variant="secondary"
              size="sm"
              disabled={busy}
            >
              Marcar pronto
            </Button>
          </Form>

          <Form method="post">
            <Button
              type="submit"
              name="intent"
              value="dry-run"
              variant="outline"
              size="sm"
              disabled={busy}
            >
              Dry-run
            </Button>
          </Form>

          {/* publish now (confirm) */}
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" disabled={busy}>
                <Rocket className="size-4" />
                Publicar agora
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Publicar agora?</DialogTitle>
                <DialogDescription>
                  Vai publicar em: {item.platforms.join(', ') || 'nenhuma plataforma'}. Plataformas
                  já publicadas são ignoradas (sem duplicar).
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Form method="post">
                  <Button type="submit" name="intent" value="publish-now" disabled={busy}>
                    Confirmar publicação
                  </Button>
                </Form>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="flex-1" />

          {/* delete (confirm) */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive" disabled={busy}>
                <Trash2 className="size-4" />
                Excluir
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Excluir mídia?</DialogTitle>
                <DialogDescription>
                  Esta ação remove o item e a mídia associada. Não pode ser desfeita.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Form method="post">
                  <Button type="submit" name="intent" value="delete" variant="destructive">
                    Excluir definitivamente
                  </Button>
                </Form>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {result ? (
        <Card>
          <CardContent className="py-4">
            <div className="mb-2 text-sm font-medium">
              Resultado {result.dryRun ? '(dry-run)' : ''} — {result.finalStatus ?? 'simulado'}
            </div>
            <div className="grid gap-1.5">
              {result.outcomes.map((o) => (
                <div key={o.platform} className="flex items-center gap-2 text-sm">
                  <PlatformStatusBadge status={o.status} />
                  <span className="font-mono text-xs">{o.platform}</span>
                  {o.permalink ? (
                    <a
                      href={o.permalink}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      link <ExternalLink className="size-3" />
                    </a>
                  ) : null}
                  {o.error ? <span className="text-destructive">{o.error}</span> : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="platforms">
        <TabsList>
          <TabsTrigger value="platforms">Plataformas</TabsTrigger>
          <TabsTrigger value="edit">Editar</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        {/* platforms */}
        <TabsContent value="platforms">
          <Card>
            <CardContent className="grid gap-4 pt-6 lg:grid-cols-[200px_1fr]">
              <div>
                <div className="aspect-square overflow-hidden rounded-lg border border-border bg-secondary/40">
                  {preview ? (
                    item.media_type === 'video' ? (
                      <video src={preview} controls className="h-full w-full object-cover" />
                    ) : (
                      <img src={preview} alt={item.title} className="h-full w-full object-cover" />
                    )
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      sem mídia
                    </div>
                  )}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                  {item.caption || 'sem legenda'}
                </p>
              </div>

              <div>
                {item.platforms.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma plataforma selecionada.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plataforma</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden bp:table-cell">Tentativas</TableHead>
                        <TableHead>Post</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {item.platforms.map((p) => {
                        const pub = pubByPlatform.get(p)
                        return (
                          <TableRow key={p}>
                            <TableCell className="font-medium">{PLATFORM_LABELS[p]}</TableCell>
                            <TableCell>
                              <PlatformStatusBadge status={pub?.status ?? 'pending'} />
                              {pub?.error ? (
                                <div className="mt-1 max-w-xs text-xs text-destructive">
                                  {pub.error}
                                </div>
                              ) : null}
                            </TableCell>
                            <TableCell className="hidden text-sm text-muted-foreground bp:table-cell">
                              {pub?.attempts ?? 0}
                            </TableCell>
                            <TableCell>
                              {pub?.permalink ? (
                                <a
                                  href={pub.permalink}
                                  target="_blank"
                                  rel="noopener"
                                  className="inline-flex items-center gap-1 text-primary hover:underline"
                                >
                                  abrir <ExternalLink className="size-3" />
                                </a>
                              ) : pub?.remote_post_id ? (
                                <span className="font-mono text-xs text-muted-foreground">
                                  {pub.remote_post_id}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
                <div className="mt-4 grid gap-1 text-sm text-muted-foreground">
                  <div>
                    Agendado: <span className="text-foreground">{item.publish_at ? formatDateTime(item.publish_at) : '—'}</span>
                  </div>
                  <div>
                    Manter mídia:{' '}
                    <Badge variant={item.retain_media_after_publish ? 'secondary' : 'warning'}>
                      {item.retain_media_after_publish ? 'sim' : 'apagar após publicar'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* edit */}
        <TabsContent value="edit">
          <Card>
            <CardContent className="pt-6">
              <Form method="post" encType="multipart/form-data" className="grid gap-6">
                <input type="hidden" name="intent" value="update" />
                <MediaFields item={item} />

                <div className="grid gap-3 rounded-lg border border-dashed border-border p-4">
                  <div className="grid gap-2">
                    <Label htmlFor="media">Substituir arquivo (opcional)</Label>
                    <Input id="media" name="media" type="file" accept="image/*,video/*" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="mediaUrl">…ou nova URL pública</Label>
                    <Input id="mediaUrl" name="mediaUrl" type="url" placeholder="https://…" />
                  </div>
                </div>

                <div>
                  <Button type="submit" disabled={busy}>
                    Salvar alterações
                  </Button>
                </div>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* history */}
        <TabsContent value="history">
          <Card>
            <CardContent className="pt-6">
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem histórico ainda.</p>
              ) : (
                <div className="grid gap-3">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 border-l-2 border-border pl-3">
                      <div className="grid gap-0.5">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-mono uppercase tracking-wide">{log.action}</span>
                          {log.platform ? <span>· {log.platform}</span> : null}
                          <span>· {log.status}</span>
                        </div>
                        <div className="text-sm">{log.message}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">
                          {formatDateTime(log.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
