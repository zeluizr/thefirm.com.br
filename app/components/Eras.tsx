import { History } from 'lucide-react'

import { Eyebrow } from './Eyebrow'
import { Wrap } from './Wrap'

type Era = {
  num: string
  title: string
  body: string
  tag: string
  alive?: boolean
}

const eras: Era[] = [
  {
    num: '01',
    title: 'La broma',
    body: 'Nació de una broma con The Firm, la marca de skate de Bob Burnquist. El nombre pegó — y antes de que me diera cuenta, ya era un dominio de verdad.',
    tag: 'el origen',
  },
  {
    num: '02',
    title: 'La era freelancer',
    body: 'Durante mucho tiempo así me encontraban los clientes. thefirm.com.br era, en la práctica, yo. Mi primera dirección en la web con nombre propio.',
    tag: 'el auge',
  },
  {
    num: '03',
    title: 'El letargo',
    body: 'Entonces el sitio murió. El dominio siguió pago, renovación tras renovación, pero la luz se había apagado. Una dirección sin casa adentro.',
    tag: 'el silencio',
  },
  {
    num: '04',
    title: 'De vuelta a la vida',
    body: 'Ahora vuelve a ser casa: las marcas, los experimentos, la historia. No para vender — para existir. El primer dominio, a punto de cumplir veinte años, todavía rodando.',
    tag: 'ahora',
    alive: true,
  },
]

export function Eras() {
  return (
    <section id='origin' className='py-[84px]'>
      <Wrap>
        <div className='mb-11'>
          <Eyebrow variant='magenta' icon={History}>
            la ficha del dominio
          </Eyebrow>
          <h2 className='glitch mt-4 font-display text-[clamp(34px,6vw,64px)] uppercase leading-[0.9] tracking-[-0.02em]'>
            las vidas de
            <br />
            esta dirección
          </h2>
        </div>

        {eras.map((era, i) => {
          // mirrors `.era:nth-child(odd)` in the reference: eras 02 and 04 are
          // solid ink, eras 01 and 03 are paper with an ink outline
          const filled = i % 2 === 1
          const isLast = i === eras.length - 1

          return (
            <div
              key={era.num}
              className={`grid grid-cols-[70px_1fr] items-start gap-4 border-t-[3px] border-bone py-[30px] bp:grid-cols-[130px_1fr] bp:gap-7 ${
                isLast ? 'border-b-[3px]' : ''
              }`}
            >
              <div
                className={`font-display text-[44px] leading-none bp:text-[64px] ${
                  filled ? 'text-wire' : 'text-void text-stroke-bone'
                }`}
              >
                {era.num}
              </div>
              <div>
                <h3 className='mb-2 text-[25px] font-bold text-bone'>
                  {era.title}
                </h3>
                <p className='max-w-[640px] text-bone-dim'>{era.body}</p>
                <span
                  className={`mt-3 inline-block border-2 border-bone px-[9px] py-[3px] font-mono text-[12px] uppercase tracking-[1px] ${
                    era.alive ? 'bg-magenta text-void' : 'text-bone'
                  }`}
                >
                  {era.tag}
                </span>
              </div>
            </div>
          )
        })}
      </Wrap>
    </section>
  )
}
