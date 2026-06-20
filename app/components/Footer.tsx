import { motion } from 'framer-motion'
import { Link } from 'react-router'
import type { LucideIcon } from 'lucide-react'
import { Globe, ScrollText } from 'lucide-react'

import { inView, reveal, stagger } from '~/lib/motion'

import { Wrap } from './Wrap'

type FootLink = {
  label: string
  href: string
  external?: boolean
  icon: LucideIcon
  primary?: boolean
}

const footLinks: FootLink[] = [
  {
    label: 'zeluizr.com',
    href: 'https://zeluizr.com',
    external: true,
    icon: Globe,
  },
]

export function Footer() {
  return (
    <footer
      id='contacto'
      className='border-t-[3px] border-bone bg-void-2 px-0 pt-24 pb-12 text-bone bp:pt-30 bp:pb-16'
    >
      <Wrap>
        <motion.div
          variants={stagger}
          initial='hidden'
          whileInView='show'
          viewport={inView}
        >
          <motion.div
            variants={reveal}
            className='glitch inline-block font-display text-[clamp(44px,9vw,120px)] uppercase leading-[0.82] tracking-[-0.03em]'
          >
            the
            <br />
            firm<span className='text-wire'>.</span>
          </motion.div>
          <motion.div
            variants={reveal}
            className='mt-12 flex flex-wrap items-end justify-between gap-x-16 gap-y-8 bp:mt-14'
          >
          <div className='flex flex-wrap gap-x-3 gap-y-2'>
            <Link
              to='/manifiesto'
              className='inline-flex items-center gap-2 border-2 border-bone bg-magenta px-3.5 py-2 font-mono text-[13px] uppercase leading-none tracking-[1px] text-void no-underline transition-colors duration-150 hover:bg-bone motion-reduce:transition-none'
            >
              <ScrollText size={14} strokeWidth={2.5} aria-hidden='true' />
              manifiesto
            </Link>
            {footLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                {...(link.external
                  ? { target: '_blank', rel: 'noopener' }
                  : {})}
                className={`inline-flex items-center gap-2 border-2 border-bone px-3.5 py-2 font-mono text-[13px] uppercase leading-none tracking-[1px] no-underline transition-colors duration-150 motion-reduce:transition-none ${
                  link.primary
                    ? 'bg-magenta text-void hover:bg-bone'
                    : 'hover:bg-magenta hover:text-void'
                }`}
              >
                <link.icon size={14} strokeWidth={2.5} aria-hidden='true' />
                {link.label}
              </a>
            ))}
          </div>
          <div className='font-mono text-[12px] leading-[1.85] tracking-[1px] text-bone-dim'>
            São Paulo → Santiago ·{' '}
            <span className='text-magenta'>todavía rodando</span>
            <br />© thefirm.com.br — resucitado en 2026, rumbo a los 20 años
            <br />
            best viewed with the sound of urethane on concrete
          </div>
          </motion.div>
        </motion.div>
      </Wrap>
    </footer>
  )
}
