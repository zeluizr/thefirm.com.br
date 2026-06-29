import { Link } from 'react-router'

import { listCategoriesWithPosts, listPublishedPosts } from '@server/queries'
import { SiteFooter, SiteHeader } from '~/components/SiteHeader'
import { Badge } from '~/components/ui/badge'
import type { Route } from './+types/home'

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url)
  const cat = url.searchParams.get('cat') ?? undefined
  const [posts, categories] = await Promise.all([
    listPublishedPosts(cat),
    listCategoriesWithPosts(),
  ])
  return { posts, categories, cat: cat ?? null }
}

export function meta(_: Route.MetaArgs) {
  return [{ title: 'the firm' }]
}

function fmtDate(d: Date | string | null) {
  if (!d) return ''
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(d))
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { posts, categories, cat } = loaderData

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        {/* filtro por categoria */}
        {categories.length > 0 && (
          <nav className="mb-8 flex flex-wrap gap-2">
            <Link to="/" className="contents">
              <Badge variant={cat ? 'outline' : 'default'}>tudo</Badge>
            </Link>
            {categories.map((c) => (
              <Link key={c.id} to={`/?cat=${c.slug}`} className="contents">
                <Badge variant={cat === c.slug ? 'default' : 'outline'}>{c.name}</Badge>
              </Link>
            ))}
          </nav>
        )}

        {posts.length === 0 ? (
          <p className="border-2 border-border bg-card p-6 font-mono text-sm">
            nada publicado ainda. o primeiro post sai do forno em breve.
          </p>
        ) : (
          <ul className="flex flex-col gap-6">
            {posts.map((post) => (
              <li key={post.id}>
                <Link
                  to={`/post/${post.slug}`}
                  className="brut brut-hover block overflow-hidden"
                >
                  {post.imageUrl && (
                    <img
                      src={post.imageUrl}
                      alt=""
                      className="aspect-[16/9] w-full border-b-2 border-border object-cover"
                      loading="lazy"
                    />
                  )}
                  <div className="flex flex-col gap-2 p-5">
                    <div className="flex items-center gap-3">
                      <Badge variant="accent">{post.category.name}</Badge>
                      <span className="font-mono text-xs text-muted-foreground">
                        {fmtDate(post.publishedAt)}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold leading-tight tracking-tight">
                      {post.title}
                    </h2>
                    <p className="text-muted-foreground">{post.summary}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
