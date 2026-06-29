import { motion } from 'framer-motion'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { Link } from 'react-router'

import { Eyebrow } from '~/components/Eyebrow'
import { Footer } from '~/components/Footer'
import { Wrap } from '~/components/Wrap'
import { easeOut, inView, reveal, stagger } from '~/lib/motion'
import { listPublishedForArchive, listPublications } from '~/services/media.server'
import { previewUrl } from '~/services/storage.server'
import { PLATFORM_LABELS, type Platform } from '~/services/types'

import type { Route } from './+types/archive'

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'the firm — arquivo' },
    { name: 'description', content: 'O arquivo público de O Outro José: o que já foi ao ar.' },
  ]
}

export async function loader(_: Route.LoaderArgs) {
  const items = await listPublishedForArchive()
  const entries = await Promise.all(
    items.map(async (item) => {
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
        links,
      }
    }),
  )
  return { entries }
}

export default function Archive({ loaderData }: Route.ComponentProps) {
  const { entries } = loaderData

  return (
    <>
      <main className="pt-20 pb-24 bp:pt-28">
        <Wrap>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={easeOut}>
            <Link
              to="/"
              className="inline-flex items-center gap-2 font-mono text-[13px] uppercase tracking-[2px] text-bone-dim no-underline transition-colors hover:text-magenta motion-reduce:transition-none"
            >
              <ArrowLeft size={14} strokeWidth={2.5} aria-hidden="true" />
              voltar
            </Link>
            <div className="mt-10 bp:mt-14">
              <Eyebrow>arquivo · {String(entries.length).padStart(2, '0')} transmissões</Eyebrow>
              <h1 className="glitch mt-5 font-display text-[clamp(40px,8vw,104px)] uppercase leading-[0.84] tracking-[-0.03em]">
                o que <span className="text-wire">foi</span><br />ao ar
              </h1>
            </div>
          </motion.div>

          {entries.length === 0 ? (
            <p className="mt-16 font-mono text-[14px] uppercase tracking-[2px] text-bone-dim">
              o arquivo ainda está em silêncio.
            </p>
          ) : (
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={inView}
              className="mt-16 grid gap-px overflow-hidden border-[3px] border-bone bg-bone bp:mt-20 bp:grid-cols-2 lg:grid-cols-3"
            >
              {entries.map((e) => (
                <motion.article key={e.id} variants={reveal} className="flex flex-col bg-void-2">
                  <div className="aspect-square overflow-hidden border-b-[3px] border-bone bg-void-3">
                    {e.thumb ? (
                      e.mediaType === 'video' ? (
                        <video
                          src={e.thumb}
                          muted
                          loop
                          playsInline
                          preload="metadata"
                          onMouseEnter={(ev) => void ev.currentTarget.play().catch(() => {})}
                          onMouseLeave={(ev) => ev.currentTarget.pause()}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <img
                          src={e.thumb}
                          alt={e.title}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      )
                    ) : (
                      <div className="flex h-full items-center justify-center font-mono text-[12px] uppercase tracking-[2px] text-bone-dim">
                        sem mídia
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h2 className="font-display text-[19px] uppercase leading-[1] tracking-[-0.01em]">
                      {e.title}
                    </h2>
                    <p className="mt-3 line-clamp-3 text-[14px] leading-[1.55] text-bone-dim">
                      {e.caption}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {e.links.map((l) => (
                        <a
                          key={l.platform}
                          href={l.permalink}
                          target="_blank"
                          rel="noopener"
                          className="inline-flex items-center gap-1.5 border border-bone/40 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[1px] text-bone no-underline transition-colors hover:bg-magenta hover:text-void motion-reduce:transition-none"
                        >
                          {PLATFORM_LABELS[l.platform as Platform]}
                          <ExternalLink size={11} strokeWidth={2.5} aria-hidden="true" />
                        </a>
                      ))}
                    </div>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          )}
        </Wrap>
      </main>
      <Footer />
    </>
  )
}
