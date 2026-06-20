import { SectionHead } from './SectionHead'
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
    body: 'São Paulo, 20/03/2007. Necesitaba hacer una plata y quería armar sitios para mi gente del skate — un nombre fácil de asociar. The Firm, el team de Bob Burnquist, era ese nombre. Ahí conocí a Denis Buiu, a Fabio Sleiman y a una banda de cracks de la escena: mi mejor época sobre la tabla. La broma pegó, y antes de darme cuenta ya era un dominio de verdad.',
    tag: 'el origen',
  },
  {
    num: '02',
    title: 'La era freelancer',
    body: 'Durante años, The Firm fue mi nombre. Así me encontraban los clientes mientras la carrera crecía — de São Paulo a Río, a Buenos Aires, a Santiago. thefirm.com.br era, en la práctica, yo.',
    tag: 'el auge',
  },
  {
    num: '03',
    title: 'El letargo',
    body: 'Después lo fui dejando de lado. Llegaron los proyectos grandes y, más tarde, commente, inmmerce, integram — y la luz de The Firm se apagó. El dominio siguió pago, renovación tras renovación: una dirección sin casa adentro.',
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
    <section id='origin' className='py-20 bp:py-[120px]'>
      <Wrap>
        <SectionHead
          eyebrow='la ficha del dominio'
          count='04 vidas'
          title={
            <>
              las vidas de
              <br />
              esta dirección
            </>
          }
        />

        {eras.map((era, i) => {
          // mirrors `.era:nth-child(odd)` in the reference: eras 02 and 04 are
          // solid ink, eras 01 and 03 are paper with an ink outline
          const filled = i % 2 === 1
          const isLast = i === eras.length - 1

          return (
            <div
              key={era.num}
              className={`grid grid-cols-[64px_1fr] items-start gap-5 border-t-[3px] border-bone py-8 bp:grid-cols-[128px_1fr] bp:gap-8 bp:py-10 ${
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
                <h3 className='mb-3 text-[24px] font-bold leading-[1.15] text-bone'>
                  {era.title}
                </h3>
                <p className='max-w-[640px] leading-[1.6] text-bone-dim'>
                  {era.body}
                </p>
                <span
                  className={`mt-4 inline-block border-2 border-bone px-[10px] py-1 font-mono text-[12px] uppercase leading-none tracking-[1px] ${
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
