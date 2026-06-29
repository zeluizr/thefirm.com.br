import { Form, Link } from 'react-router'

import { db } from '@server/lib/db'
import { requireAdmin } from '@server/lib/session'
import { syncTelegram } from '@server/telegram/notify'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import type { Route } from './+types/posts'

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request)
  const [posts, categories] = await Promise.all([
    db.post.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { category: true },
    }),
    db.category.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ])
  return { posts, categories }
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request)
  const form = await request.formData()
  const intent = String(form.get('intent'))
  const id = String(form.get('postId'))

  switch (intent) {
    case 'delete':
      await db.post.delete({ where: { id } })
      break
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
    case 'recat':
      await db.post.update({
        where: { id },
        data: { categoryId: String(form.get('categoryId')) },
      })
      break
  }
  if (intent !== 'delete') {
    try {
      await syncTelegram(id)
    } catch {
      /* ignora */
    }
  }
  return { ok: true }
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'accent' | 'destructive'> = {
  PUBLISHED: 'default',
  PENDING_REVIEW: 'accent',
  GENERATING_MEDIA: 'secondary',
  REJECTED: 'destructive',
}

export default function AdminPosts({ loaderData }: Route.ComponentProps) {
  const { posts, categories } = loaderData

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">posts</h1>

      <ul className="flex flex-col gap-3">
        {posts.map((p) => (
          <li key={p.id} className="brut flex flex-col gap-3 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Badge variant={STATUS_VARIANT[p.status] ?? 'secondary'}>
                    {p.status.toLowerCase().replace('_', ' ')}
                  </Badge>
                  <Badge variant="outline">{p.category.name}</Badge>
                </div>
                <Link to={`/admin/posts/${p.id}`} className="font-bold hover:underline">
                  {p.title}
                </Link>
                <span className="font-mono text-xs text-muted-foreground">{p.slug}</span>
                {p.moderationReason && (
                  <span className="font-mono text-xs text-destructive">
                    {p.moderationReason}
                  </span>
                )}
              </div>
              {p.imageUrl && (
                <img
                  src={p.imageUrl}
                  alt=""
                  className="h-16 w-24 border-2 border-border object-cover"
                />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t-2 border-border pt-3">
              {p.status !== 'PUBLISHED' ? (
                <Form method="post">
                  <input type="hidden" name="postId" value={p.id} />
                  <input type="hidden" name="intent" value="publish" />
                  <Button type="submit" size="sm">
                    publicar
                  </Button>
                </Form>
              ) : (
                <>
                  <Link to={`/post/${p.slug}`} className="contents">
                    <Button size="sm" variant="outline" type="button">
                      ver
                    </Button>
                  </Link>
                  <Form method="post">
                    <input type="hidden" name="postId" value={p.id} />
                    <input type="hidden" name="intent" value="unpublish" />
                    <Button type="submit" size="sm" variant="outline">
                      despublicar
                    </Button>
                  </Form>
                </>
              )}

              <Form method="post" className="flex items-center gap-1">
                <input type="hidden" name="postId" value={p.id} />
                <input type="hidden" name="intent" value="recat" />
                <select
                  name="categoryId"
                  defaultValue={p.categoryId}
                  className="h-8 border-2 border-input bg-background px-2 text-xs"
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
                <input type="hidden" name="postId" value={p.id} />
                <input type="hidden" name="intent" value="delete" />
                <Button type="submit" size="sm" variant="destructive">
                  deletar
                </Button>
              </Form>
            </div>
          </li>
        ))}
        {posts.length === 0 && (
          <li className="border-2 border-border bg-card px-4 py-6 text-center font-mono text-sm text-muted-foreground">
            nenhum post ainda.
          </li>
        )}
      </ul>
    </div>
  )
}
