import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

import { easeOut, inView } from '~/lib/motion'

import { Eyebrow } from './Eyebrow'

type SectionHeadProps = {
  eyebrow: ReactNode
  title: ReactNode
  /** truthful item count for this section, e.g. `03 marcas` */
  count: string
}

export function SectionHead({ eyebrow, title, count }: SectionHeadProps) {
  return (
    <motion.div
      className='mb-12 flex items-end justify-between gap-6 border-b-[3px] border-bone pb-6 bp:mb-16'
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={inView}
      transition={easeOut}
    >
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className='glitch mt-4 font-display text-[clamp(34px,6vw,64px)] uppercase leading-[0.9] tracking-[-0.02em]'>
          {title}
        </h2>
      </div>
      <span className='hidden shrink-0 pb-1.5 font-mono text-[13px] uppercase tracking-[3px] text-bone-dim bp:block'>
        {count}
      </span>
    </motion.div>
  )
}
