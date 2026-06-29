import { motion } from 'framer-motion'
import { ArrowUpRight, ExternalLink, Play } from 'lucide-react'
import { Link } from 'react-router'

import { SectionHead } from '~/components/SectionHead'
import { Wrap } from '~/components/Wrap'
import { inView, reveal, stagger } from '~/lib/motion'
import { formatDate } from '~/lib/format'
import { PLATFORM_LABELS } from '~/services/types'

import type { FotologPost } from './types'

function PostCard({ post }: { post: FotologPost }) {
  // Alternate the hard-shadow accent for rhythm down the wall.
  const purple = post.index % 2 === 0
  const frame = purple
    ? 'shadow-[4px_4px_0_var(--color-purple)] hover:shadow-[7px_7px_0_var(--color-purple)]'
    : 'shadow-[4px_4px_0_var(--color-magenta)] hover:shadow-[7px_7px_0_var(--color-magenta)]'

  return (
    <motion.figure
      variants={reveal}
      className={`group mb-5 block break-inside-avoid border-[3px] border-bone bg-void-2 transition-all duration-200 hover:-translate-x-[3px] hover:-translate-y-[3px] motion-reduce:transition-none ${frame}`}
    >
      <div className="relative overflow-hidden border-b-[3px] border-bone bg-void-3">
        <span className="absolute left-0 top-0 z-10 bg-void/85 px-2 py-1 font-mono text-[11px] font-bold tracking-[1px] text-magenta">
          #{String(post.index).padStart(3, '0')}
        </span>
        {post.mediaType === 'video' ? (
          <span className="absolute right-0 top-0 z-10 inline-flex items-center gap-1 bg-void/85 px-2 py-1 font-mono text-[10px] uppercase tracking-[1px] text-magenta">
            <Play size={10} strokeWidth={3} aria-hidden="true" /> vídeo
          </span>
        ) : null}
        {post.thumb ? (
          post.mediaType === 'video' ? (
            <video
              src={post.thumb}
              muted
              loop
              playsInline
              preload="metadata"
              onMouseEnter={(e) => void e.currentTarget.play().catch(() => {})}
              onMouseLeave={(e) => e.currentTarget.pause()}
              className="block w-full transition-all duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
            />
          ) : (
            <img
              src={post.thumb}
              alt={post.title}
              loading="lazy"
              className="block w-full transition-all duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
            />
          )
        ) : (
          <div className="flex aspect-[4/5] items-center justify-center font-mono text-[12px] uppercase tracking-[2px] text-bone-dim">
            sem mídia
          </div>
        )}
      </div>

      <figcaption className="p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="glitch font-display text-[18px] lowercase leading-[1.05] tracking-[-0.01em] text-bone">
            {post.title}
          </h3>
          <span className="shrink-0 font-mono text-[10px] uppercase tracking-[1px] text-bone-dim">
            {formatDate(post.createdAt)}
          </span>
        </div>
        <p className="mt-2 text-[14px] leading-[1.55] text-bone-dim">{post.caption}</p>

        {post.links.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.links.map((l) => (
              <a
                key={l.platform}
                href={l.permalink}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1 border border-bone/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[1px] text-bone no-underline transition-colors hover:bg-magenta hover:text-void motion-reduce:transition-none"
              >
                {PLATFORM_LABELS[l.platform]}
                <ExternalLink size={10} strokeWidth={2.5} aria-hidden="true" />
              </a>
            ))}
          </div>
        ) : null}
      </figcaption>
    </motion.figure>
  )
}

export function PostWall({ posts }: { posts: FotologPost[] }) {
  return (
    <section id="mural" className="py-20 bp:py-28">
      <Wrap>
        <SectionHead
          eyebrow="o mural"
          count={`${String(posts.length).padStart(2, '0')} loucuras`}
          title={
            <>
              o mural
              <br />
              de loucuras
            </>
          }
        />

        {posts.length === 0 ? (
          <p className="font-mono text-[14px] uppercase tracking-[2px] text-bone-dim">
            o mural ainda está em silêncio.
          </p>
        ) : (
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={inView}
            className="columns-1 gap-5 bp:columns-2 lg:columns-3"
          >
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={inView}
          className="mt-12 flex justify-center"
        >
          <Link
            to="/archive"
            className="inline-flex items-center gap-2 border-2 border-bone px-4 py-2.5 font-mono text-[13px] uppercase leading-none tracking-[1px] no-underline transition-colors hover:bg-magenta hover:text-void motion-reduce:transition-none"
          >
            ver o arquivo completo
            <ArrowUpRight size={14} strokeWidth={2.5} aria-hidden="true" />
          </Link>
        </motion.div>
      </Wrap>
    </section>
  )
}
