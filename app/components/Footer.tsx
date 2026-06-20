import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight, CalendarDays, GitFork, Package } from 'lucide-react'

import { Wrap } from './Wrap'

type FootLink = {
  label: string
  href: string
  external?: boolean
  icon: LucideIcon
  primary?: boolean
}

const footLinks: FootLink[] = [
  { label: 'github', href: 'https://github.com/zeluizr', external: true, icon: GitFork },
  {
    label: 'npm',
    href: 'https://www.npmjs.com/~zeluizr',
    external: true,
    icon: Package,
  },
  {
    label: 'commente.me',
    href: 'https://commente.me',
    external: true,
    icon: ArrowUpRight,
  },
  {
    label: 'integram.me',
    href: 'https://integram.me',
    external: true,
    icon: ArrowUpRight,
  },
  {
    label: 'agenda una llamada',
    href: 'https://calendly.com/zeluizr',
    external: true,
    icon: CalendarDays,
    primary: true,
  },
]

export function Footer() {
  return (
    <footer
      id='contacto'
      className='border-t-[3px] border-bone bg-void-2 px-0 pt-24 pb-12 text-bone bp:pt-[120px] bp:pb-16'
    >
      <Wrap>
        <div className='glitch inline-block font-display text-[clamp(44px,9vw,120px)] uppercase leading-[0.82] tracking-[-0.03em]'>
          the
          <br />
          firm<span className='text-wire'>.</span>
        </div>
        <div className='mt-12 flex flex-wrap items-end justify-between gap-x-16 gap-y-8'>
          <div className='flex flex-wrap gap-x-3 gap-y-2'>
            {footLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                {...(link.external
                  ? { target: '_blank', rel: 'noopener' }
                  : {})}
                className={`inline-flex items-center gap-2 border-2 border-bone px-[14px] py-2 font-mono text-[13px] uppercase leading-none tracking-[1px] no-underline transition-colors duration-150 motion-reduce:transition-none ${
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
        </div>
      </Wrap>
    </footer>
  )
}
