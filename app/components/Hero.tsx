import { motion } from 'framer-motion'
import { Skull } from 'lucide-react'

import { reveal, stagger } from '~/lib/motion'

import { Eyebrow } from './Eyebrow'
import { Wrap } from './Wrap'

function Stamp() {
  return (
    <div className='inline-flex shrink-0 items-stretch border-[3px] border-bone shadow-hard-sm'>
      <span className='flex items-center bg-magenta px-3.25 py-2 text-void bp:px-4 bp:py-2.5'>
        <Skull size={32} strokeWidth={2.5} aria-hidden='true' />
      </span>
      <span className='flex flex-col justify-center px-4.5 font-mono'>
        <span className='text-[14px] font-bold uppercase tracking-[2px] text-bone'>
          reactivated
        </span>
        <span className='mt-0.5 text-[12px] tracking-[1px] text-bone-dim'>
          back from the dead
        </span>
      </span>
    </div>
  )
}

function Anniversary() {
  return (
    <div className='inline-flex items-stretch border-[3px] border-bone shadow-hard-sm'>
      <span className='flex items-center bg-purple px-3.5 py-2 font-display text-[30px] leading-none text-void bp:px-4.5 bp:py-2.5 bp:text-[38px]'>
        20
      </span>
      <span className='flex flex-col justify-center px-4.5 font-mono'>
        <span className='text-[14px] font-bold uppercase tracking-[2px] text-bone'>
          años rodando
        </span>
        <span className='mt-0.5 text-[12px] tracking-[1px] text-bone-dim'>
          <b className='font-bold text-magenta'>2007</b> →{' '}
          <b className='font-bold text-magenta'>2027</b>
        </span>
      </span>
    </div>
  )
}

export function Hero() {
  return (
    <header className='relative pt-[clamp(52px,8vw,100px)] pb-12'>
      <Wrap>
        <motion.div variants={stagger} initial='hidden' animate='show'>
          <motion.div variants={reveal} className='mb-6'>
            <Eyebrow>est. 20/03/2007 · são paulo, br · v2.0</Eyebrow>
          </motion.div>

          <motion.h1
            variants={reveal}
            className='glitch font-display text-[clamp(72px,16vw,188px)] uppercase leading-[0.82] tracking-[-0.03em]'
          >
            the
            <br />
            firm<span className='text-wire'>.</span>
          </motion.h1>

          <motion.p
            variants={reveal}
            className='mt-8 max-w-155 text-[clamp(18px,2.2vw,22px)] font-medium leading-normal'
          >
            Empezó como una broma con la marca de skate. Durante años fue mi
            nombre como freelancer. Después{' '}
            <b className='bg-magenta px-1 font-bold text-void'>murió</b>. Ahora es
            territorio libre — sin clientes que complacer, solo lo que yo quiera
            construir.
          </motion.p>

          <motion.div
            variants={reveal}
            className='mt-10 flex flex-wrap items-stretch gap-x-4 gap-y-6'
          >
            <Anniversary />
            <Stamp />
          </motion.div>
        </motion.div>
      </Wrap>
    </header>
  )
}
