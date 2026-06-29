import { Form, Link, redirect } from 'react-router'

import { db } from '@server/lib/db'
import { requireAdmin } from '@server/lib/session'
import { notifyPost, syncTelegram } from '@server/telegram/notify'
import { Markdown } from '~/components/Markdown'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import type { Route } from './+types/post'

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireAdmin(request)
  const [post, categories, moderation] = await Promise.all([
    db.post.findUnique({ where: { id: params.id }, include: { category: true } }),
    db.category.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    db.moderationLog.findMany({
      where: { postId: params.id },
      orderBy: { createdAt: 'asc' },
    }),
  ])
  if (!post) throw new Response('not found', { status: 404 })
  return { post, categories, moderation }
}

export async function action({ request, params }: Route.ActionArgs) {
  await requireAdmin(request)
  const form = await request.formData()
  const intent = String(form.get('intent'))
  const id = params.id

  // reenvia uma preview nova pro Telegram (não mexe no status)
  if (intent === 'renotify') {
    try {
      await notifyPost(id)
      return { ok: true, message: 'reenviado pro Telegram ✓' }
    } catch (e) {
      return { error: `falha ao reenviar: ${(e as Error).message}` }
    }
  }

  switch (intent) {
    case 'publish':
      await db.post.update({
        where: { id },
        data: { status: 'PUBLISHED', publishedAt: new Date() },
      })
      break
    case 'unpublish':
      await db.post.update({
        where: { id },
        data: { status: 'PENDING_REVIEW', publishedAt: null },
      })
      break
    case 'reject':
      await db.post.update({ where: { id }, data: { status: 'REJECTED' } })
      break
    case 'recat':
      await db.post.update({
        where: { id },
        data: { categoryId: String(form.get('categoryId')) },
      })
      break
    case 'delete':
      await db.post.delete({ where: { id } })
      throw redirect('/admin/posts')
  }
  // reflete a ação na mensagem do Telegram (se houver) — não derruba a ação se falhar
  try {
    await syncTelegram(id)
  } catch {
    /* ignora */
  }
  return { ok: true }
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'accent' | 'destructive'> = {
  PUBLISHED: 'default',
  PENDING_REVIEW: 'accent',
  GENERATING_MEDIA: 'secondary',
  REJECTED: 'destructive',
}

export default function AdminPost({ loaderData, actionData }: Route.ComponentProps) {
  const { post, categories, moderation } = loaderData

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link
        to="/admin/posts"
        className="font-mono text-xs font-bold uppercase tracking-widest underline"
      >
        ← todos os posts
      </Link>

      {actionData && 'error' in actionData && actionData.error && (
        <div className="border-2 border-destructive bg-destructive/10 p-3 text-sm font-bold">
          {actionData.error}
        </div>
      )}
      {actionData && 'message' in actionData && actionData.message && (
        <div className="border-2 border-border bg-secondary p-3 text-sm font-bold">
          {actionData.message}
        </div>
      )}

      {/* ações */}
      <div className="brut flex flex-wrap items-center gap-2 p-4">
        {post.status !== 'PUBLISHED' ? (
          <Form method="post">
            <input type="hidden" name="intent" value="publish" />
            <Button type="submit">✅ aprovar e publicar</Button>
          </Form>
        ) : (
          <>
            <Link to={`/post/${post.slug}`} className="contents">
              <Button type="button" variant="outline">
                ver no site
              </Button>
            </Link>
            <Form method="post">
              <input type="hidden" name="intent" value="unpublish" />
              <Button type="submit" variant="outline">
                despublicar
              </Button>
            </Form>
          </>
        )}
        {post.status !== 'REJECTED' && (
          <Form method="post">
            <input type="hidden" name="intent" value="reject" />
            <Button type="submit" variant="outline">
              🗑️ rejeitar
            </Button>
          </Form>
        )}
        <Form method="post">
          <input type="hidden" name="intent" value="renotify" />
          <Button type="submit" variant="outline">
            📨 reenviar pro Telegram
          </Button>
        </Form>
        <Form method="post" className="flex items-center gap-1">
          <input type="hidden" name="intent" value="recat" />
          <select
            name="categoryId"
            defaultValue={post.categoryId}
            className="h-9 border-2 border-input bg-background px-2 text-xs"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <Button type="submit" size="sm" variant="outline">
            trocar
          </Button>
        </Form>
        <Form method="post" className="ml-auto">
          <input type="hidden" name="intent" value="delete" />
          <Button type="submit" variant="destructive">
            deletar
          </Button>
        </Form>
      </div>

      {/* preview do conteúdo */}
      <article className="flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_VARIANT[post.status] ?? 'secondary'}>
            {post.status.toLowerCase().replace('_', ' ')}
          </Badge>
          <Badge variant="outline">{post.category.name}</Badge>
        </div>

        {post.videoUrl ? (
          <video
            src={post.videoUrl}
            poster={post.imageUrl ?? undefined}
            controls
            playsInline
            className="aspect-video w-full border-2 border-border"
          />
        ) : (
          post.imageUrl && (
            <img src={post.imageUrl} alt="" className="w-full border-2 border-border" />
          )
        )}

        <h1 className="text-3xl font-bold leading-tight tracking-tight">{post.title}</h1>
        <p className="text-lg text-muted-foreground">{post.summary}</p>

        <Markdown>{post.body}</Markdown>

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <Badge key={t} variant="secondary">
                #{t}
              </Badge>
            ))}
          </div>
        )}
      </article>

      {/* moderação + prompt de imagem (auditoria) */}
      <section className="brut flex flex-col gap-3 p-4">
        <h2 className="text-sm font-bold uppercase tracking-wide">moderação</h2>
        {post.moderationReason && (
          <p className="font-mono text-xs text-destructive">{post.moderationReason}</p>
        )}
        <div className="flex flex-wrap gap-2">
          {moderation.map((m) => (
            <Badge key={m.id} variant={m.passed ? 'default' : 'destructive'}>
              {m.provider}: {m.passed ? 'passou' : 'reprovou'}
            </Badge>
          ))}
          {moderation.length === 0 && (
            <span className="font-mono text-xs text-muted-foreground">sem logs</span>
          )}
        </div>
        {post.imagePrompt && (
          <details className="text-xs">
            <summary className="cursor-pointer font-bold uppercase tracking-wide">
              imagePrompt
            </summary>
            <p className="mt-1 font-mono text-muted-foreground">{post.imagePrompt}</p>
          </details>
        )}
      </section>
    </div>
  )
}
