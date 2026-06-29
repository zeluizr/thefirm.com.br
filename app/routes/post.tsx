import { Link } from 'react-router'

import { getPublishedPostBySlug } from '@server/queries'
import { Markdown } from '~/components/Markdown'
import { SiteFooter, SiteHeader } from '~/components/SiteHeader'
import { Badge } from '~/components/ui/badge'
import type { Route } from './+types/post'

export async function loader({ params }: Route.LoaderArgs) {
  const post = await getPublishedPostBySlug(params.slug)
  if (!post) throw new Response('not found', { status: 404 })
  return { post }
}

export function meta({ data }: Route.MetaArgs) {
  if (!data?.post) return [{ title: 'the firm' }]
  return [
    { title: `${data.post.title} · the firm` },
    { name: 'description', content: data.post.summary },
    { property: 'og:title', content: data.post.title },
    { property: 'og:description', content: data.post.summary },
    ...(data.post.imageUrl ? [{ property: 'og:image', content: data.post.imageUrl }] : []),
  ]
}

function fmtDate(d: Date | string | null) {
  if (!d) return ''
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(d))
}

export default function Post({ loaderData }: Route.ComponentProps) {
  const { post } = loaderData

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <Link
          to="/"
          className="mb-8 inline-block font-mono text-xs font-bold uppercase tracking-widest underline"
        >
          ← todos os posts
        </Link>

        <article className="flex flex-col gap-6">
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
              <img
                src={post.imageUrl}
                alt=""
                className="w-full border-2 border-border"
              />
            )
          )}

          <header className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Badge variant="accent">{post.category.name}</Badge>
              <span className="font-mono text-xs text-muted-foreground">
                {fmtDate(post.publishedAt)}
              </span>
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight">
              {post.title}
            </h1>
            <p className="text-lg text-muted-foreground">{post.summary}</p>
          </header>

          <Markdown>{post.body}</Markdown>

          {post.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 border-t-2 border-border pt-6">
              {post.tags.map((t) => (
                <Badge key={t} variant="secondary">
                  #{t}
                </Badge>
              ))}
            </div>
          )}
        </article>
      </main>

      <SiteFooter />
    </div>
  )
}
