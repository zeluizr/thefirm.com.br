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
      className='border-t-[3px] border-bone bg-void-2 px-0 pt-[70px] pb-10 text-bone'
    >
      <Wrap>
        <div className='font-display text-[clamp(48px,12vw,150px)] uppercase leading-[0.82] tracking-[-0.03em]'>
          the firm<span className='text-wire'>.</span>
        </div>
        <div className='mt-10 flex flex-wrap items-end justify-between gap-x-[60px] gap-y-[30px]'>
          <div className='flex flex-wrap gap-x-[14px] gap-y-2'>
            {footLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                {...(link.external
                  ? { target: '_blank', rel: 'noopener' }
                  : {})}
                className={`inline-flex items-center gap-2 border-2 border-bone px-[13px] py-[7px] font-mono text-[13px] uppercase tracking-[1px] no-underline transition-colors duration-150 motion-reduce:transition-none ${
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
          <div className='font-mono text-[12px] tracking-[1px] leading-[1.9] text-bone-dim'>
            Santiago, Chile ·{' '}
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
