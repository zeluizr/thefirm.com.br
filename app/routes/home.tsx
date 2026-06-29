import { Footer } from '~/components/Footer'
import { Ticker } from '~/components/Ticker'
import { HeroFotolog } from '~/components/fotolog/HeroFotolog'
import { PostWall } from '~/components/fotolog/PostWall'
import type { FotologPost } from '~/components/fotolog/types'
import { listFotologPosts, listPublications } from '~/services/media.server'
import { previewUrl } from '~/services/storage.server'

import type { Route } from './+types/home'

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'the firm — fotolog de ia' },
    {
      name: 'description',
      content:
        'O fotolog de IA de O Outro José: um mural de loucuras geradas por inteligência artificial. thefirm.com.br',
    },
  ]
}

export async function loader(_: Route.LoaderArgs) {
  const items = await listFotologPosts(60)
  const total = items.length

  const posts: FotologPost[] = await Promise.all(
    items.map(async (item, i) => {
      const pubs = await listPublications(item.id)
      const links = pubs
        .filter((p) => p.status === 'published' && p.permalink)
        .map((p) => ({ platform: p.platform, permalink: p.permalink as string }))
      return {
        id: item.id,
        slug: item.slug,
        title: item.title,
        caption: item.caption,
        mediaType: item.media_type,
        thumb: item.media_url ? await previewUrl(item.media_url) : '',
        createdAt: item.created_at,
        index: total - i, // newest = highest number
        links,
      }
    }),
  )

  return { posts }
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { posts } = loaderData

  return (
    <>
      <HeroFotolog posts={posts.slice(0, 4)} total={posts.length} />
      <Ticker />
      <main>
        <PostWall posts={posts} />
      </main>
      <Footer />
    </>
  )
}
