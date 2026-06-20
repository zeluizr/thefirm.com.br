import { Skull } from 'lucide-react'

import { Eyebrow } from './Eyebrow'
import { Wrap } from './Wrap'

function Stamp() {
  return (
    <div className='inline-flex shrink-0 items-stretch border-[3px] border-bone shadow-hard-sm'>
      <span className='flex items-center bg-magenta px-[13px] py-[8px] text-void bp:px-[16px] bp:py-[10px]'>
        <Skull size={32} strokeWidth={2.5} aria-hidden='true' />
      </span>
      <span className='flex flex-col justify-center px-[18px] font-mono'>
        <span className='text-[14px] font-bold uppercase tracking-[2px] text-bone'>
          reactivated
        </span>
        <span className='mt-[2px] text-[12px] tracking-[1px] text-bone-dim'>
          back from the dead
        </span>
      </span>
    </div>
  )
}

function Anniversary() {
  return (
    <div className='inline-flex items-stretch border-[3px] border-bone shadow-hard-sm'>
      <span className='flex items-center bg-purple px-[14px] py-[8px] font-display text-[30px] leading-none text-void bp:px-[18px] bp:py-[10px] bp:text-[38px]'>
        20
      </span>
      <span className='flex flex-col justify-center px-[18px] font-mono'>
        <span className='text-[14px] font-bold uppercase tracking-[2px] text-bone'>
          años rodando
        </span>
        <span className='mt-[2px] text-[12px] tracking-[1px] text-bone-dim'>
          <b className='font-bold text-magenta'>2007</b> →{' '}
          <b className='font-bold text-magenta'>2027</b>
        </span>
      </span>
    </div>
  )
}

export function Hero() {
  return (
    <header className='relative pt-[clamp(52px,8vw,100px)] pb-10'>
      <Wrap>
        <div className='mb-6'>
          <Eyebrow>
            est. 20/03/2007 · são paulo, br · v2.0
          </Eyebrow>
        </div>

        <h1 className='glitch font-display text-[clamp(72px,16vw,188px)] uppercase leading-[0.82] tracking-[-0.03em]'>
          the
          <br />
          firm<span className='text-wire'>.</span>
        </h1>

        <p className='mt-[34px] max-w-[620px] text-[clamp(18px,2.2vw,22px)] font-medium leading-[1.5]'>
          Empezó como una broma con la marca de skate. Durante años fue mi nombre
          como freelancer. Después{' '}
          <b className='bg-magenta px-1 font-bold text-void'>murió</b>. Ahora es
          territorio libre — sin clientes que complacer, solo lo que yo quiera
          construir.
        </p>

        <div className='mt-9 flex flex-wrap items-stretch gap-x-4 gap-y-6'>
          <Anniversary />
          <Stamp />
        </div>
      </Wrap>
    </header>
  )
}
