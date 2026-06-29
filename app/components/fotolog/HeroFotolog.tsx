import { motion } from 'framer-motion'

import { Eyebrow } from '~/components/Eyebrow'
import { Wrap } from '~/components/Wrap'
import { easeOut, reveal, stagger } from '~/lib/motion'

import type { FotologPost } from './types'

// Fixed, hand-tuned positions for the overlapping "pile of loucuras". Newest
// post is first → sits on top (highest z). Deterministic (no random) so SSR and
// client render the same layout. Rotation uses literal Tailwind classes (not
// inline style) so `group-hover:rotate-0` can straighten the photo on hover.
const layout = [
  { top: '0%', left: '4%', w: '56%', z: 'z-40', rot: 'rotate-[-5deg]', shadow: '7px 7px 0 #ff41b4' },
  { top: '3%', left: '46%', w: '50%', z: 'z-30', rot: 'rotate-[6deg]', shadow: '7px 7px 0 #a463f2' },
  { top: '43%', left: '0%', w: '49%', z: 'z-20', rot: 'rotate-[5deg]', shadow: '7px 7px 0 #a463f2' },
  { top: '45%', left: '45%', w: '52%', z: 'z-10', rot: 'rotate-[-7deg]', shadow: '7px 7px 0 #ff41b4' },
]

function Photo({ post, i }: { post: FotologPost; i: number }) {
  const spot = layout[i % layout.length]
  return (
    <motion.a
      href={post.links[0]?.permalink ?? '/archive'}
      target={post.links[0] ? '_blank' : undefined}
      rel="noopener"
      variants={reveal}
      className={`group absolute block ${spot.z} no-underline hover:z-50`}
      style={{ top: spot.top, left: spot.left, width: spot.w }}
    >
      <div
        className={`${spot.rot} border-[3px] border-bone bg-void-3 transition-all duration-200 group-hover:scale-[1.04] group-hover:rotate-0 motion-reduce:transition-none motion-reduce:group-hover:scale-100`}
        style={{ boxShadow: spot.shadow }}
      >
        <div className="aspect-[4/5] overflow-hidden">
          {post.mediaType === 'video' ? (
            <video
              src={post.thumb}
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <img
              src={post.thumb}
              alt={post.title}
              loading="eager"
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <div className="flex items-center justify-between gap-2 border-t-[3px] border-bone px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[1px] text-bone-dim">
          <span className="text-magenta">#{String(post.index).padStart(3, '0')}</span>
          <span className="truncate">{post.title}</span>
        </div>
      </div>
    </motion.a>
  )
}

export function HeroFotolog({ posts, total }: { posts: FotologPost[]; total: number }) {
  return (
    <header className="relative pt-[clamp(44px,7vw,88px)] pb-14">
      <Wrap>
        <div className="grid items-center gap-12 bp:grid-cols-[1.05fr_1fr] bp:gap-10">
          {/* left — masthead */}
          <motion.div variants={stagger} initial="hidden" animate="show">
            <motion.div variants={reveal} className="mb-6">
              <Eyebrow>fotolog de ia · o outro josé</Eyebrow>
            </motion.div>

            <motion.h1
              variants={reveal}
              className="glitch font-display text-[clamp(60px,12vw,150px)] uppercase leading-[0.82] tracking-[-0.03em]"
            >
              the
              <br />
              firm<span className="text-wire">.</span>
            </motion.h1>

            <motion.p
              variants={reveal}
              className="mt-7 max-w-125 text-[clamp(17px,2.1vw,21px)] font-medium leading-normal text-bone-dim"
            >
              Um fotolog das minhas{' '}
              <b className="bg-magenta px-1 font-bold text-void">loucuras</b> geradas por IA.
              Sem cliente, sem briefing — só imagem, legenda e o que{' '}
              <span className="text-bone">O Outro José</span> resolve transmitir.
            </motion.p>

            <motion.div
              variants={reveal}
              className="mt-9 flex flex-wrap items-stretch gap-x-4 gap-y-4"
            >
              <div className="inline-flex items-stretch border-[3px] border-bone shadow-hard-sm">
                <span className="flex items-center bg-purple px-3.5 py-2 font-display text-[26px] leading-none text-void bp:text-[30px]">
                  {String(total).padStart(2, '0')}
                </span>
                <span className="flex flex-col justify-center px-4 font-mono">
                  <span className="text-[13px] font-bold uppercase tracking-[2px] text-bone">
                    transmissões
                  </span>
                  <span className="mt-0.5 text-[12px] tracking-[1px] text-bone-dim">
                    no ar · arquivo vivo
                  </span>
                </span>
              </div>
              <div className="inline-flex items-center border-[3px] border-bone bg-magenta px-4 py-2 font-mono text-[13px] font-bold uppercase tracking-[2px] text-void shadow-hard-sm">
                o outro josé
              </div>
            </motion.div>
          </motion.div>

          {/* right — the pile of loucuras */}
          {posts.length > 0 ? (
            <>
              {/* desktop: overlapping stack */}
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="show"
                className="relative hidden aspect-[4/5] w-full bp:block"
              >
                {posts.map((post, i) => (
                  <Photo key={post.id} post={post} i={i} />
                ))}
              </motion.div>

              {/* mobile: horizontal strip */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={easeOut}
                className="-mx-6 flex gap-4 overflow-x-auto px-6 pb-2 bp:hidden"
              >
                {posts.map((post) => (
                  <a
                    key={post.id}
                    href={post.links[0]?.permalink ?? '/archive'}
                    target={post.links[0] ? '_blank' : undefined}
                    rel="noopener"
                    className="block w-[62%] shrink-0 border-[3px] border-bone bg-void-3 shadow-hard-sm no-underline"
                    style={{ rotate: post.index % 2 ? '-3deg' : '3deg' }}
                  >
                    <div className="aspect-[4/5] overflow-hidden">
                      {post.mediaType === 'video' ? (
                        <video
                          src={post.thumb}
                          autoPlay
                          muted
                          loop
                          playsInline
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <img
                          src={post.thumb}
                          alt={post.title}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                  </a>
                ))}
              </motion.div>
            </>
          ) : null}
        </div>
      </Wrap>
    </header>
  )
}
