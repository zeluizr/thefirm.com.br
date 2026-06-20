import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'

import { inView, reveal, springSnap, stagger } from '~/lib/motion'

import { SectionHead } from './SectionHead'
import { Wrap } from './Wrap'

type Experiment = {
  name: string
  what: string
  meta: string
  href: string
}

// los trabajos de la era The Firm — la marca, el cantor, los cracks del team.
// por ahora apuntan a subdominios de thefirm.com.br que reviven cada sitio;
// el original de plasma sigue vivo en el archive (ver plasmafootwear.com.br)
const experiments: Experiment[] = [
  {
    name: 'plasma',
    what: 'La marca de skate paulista. Uno de los primeros sitios que armé bajo The Firm — de vuelta como prototipo, veinte años después.',
    meta: 'sitio · marca skate',
    href: 'https://plasma.thefirm.com.br',
  },
  {
    name: 'afrox',
    what: 'El sitio del cantor, de los primeros que hice cuando The Firm recién arrancaba. Revivido como prototipo, dos décadas más tarde.',
    meta: 'sitio · música',
    href: 'https://afrox.thefirm.com.br',
  },
  {
    name: 'denis buiu',
    what: 'Sitio homenaje para uno de los cracks del team original — su parte, sus líneas, veinte años después. Prototipo en construcción.',
    meta: 'sitio · skate',
    href: 'https://denisbuiu.thefirm.com.br',
  },
  {
    name: 'fabio sleiman',
    what: 'Otro nombre de aquella época sobre la tabla, de vuelta en la web — el sitio que habría armado en 2007, ahora 20 años después. Prototipo.',
    meta: 'sitio · skate',
    href: 'https://fabiosleiman.thefirm.com.br',
  },
]

function ExpCard({ exp }: { exp: Experiment }) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.a
      href={exp.href}
      target='_blank'
      rel='noopener'
      variants={reveal}
      className='group relative flex min-h-40 flex-col border-[3px] border-bone p-6 no-underline'
      style={{ backgroundColor: '#1c1526', boxShadow: '4px 4px 0 #ff41b4' }}
      whileHover={
        reduceMotion
          ? undefined
          : {
              x: -3,
              y: -3,
              boxShadow: '7px 7px 0 #ff41b4',
              backgroundColor: '#271c33',
              transition: springSnap,
            }
      }
      whileTap={
        reduceMotion
          ? undefined
          : { x: 2, y: 2, boxShadow: '1px 1px 0 #ff41b4', transition: springSnap }
      }
    >
      <ArrowUpRight
        className='absolute right-4 top-4 text-bone-dim opacity-0 transition-opacity duration-150 group-hover:opacity-100 motion-reduce:transition-none'
        size={18}
        strokeWidth={2.5}
        aria-hidden='true'
      />
      <div className='font-display text-[24px] lowercase leading-[1.05] tracking-[-0.01em] text-bone'>
        {exp.name}
      </div>
      <div className='mt-2 flex-1 text-[15px] font-medium leading-normal text-bone-dim'>
        {exp.what}
      </div>
      <div className='mt-4 font-mono text-[11px] uppercase leading-none tracking-[1px] text-bone-dim group-hover:text-magenta motion-reduce:group-hover:text-bone-dim'>
        {exp.meta}
      </div>
    </motion.a>
  )
}

export function Lab() {
  return (
    <section id='lab' className='py-20 bp:py-30'>
      <Wrap>
        <SectionHead
          eyebrow='el archivo'
          count='04 sitios'
          title={
            <>
              los sitios
              <br />
              de the firm
            </>
          }
        />
        <p className='mb-10 max-w-140 font-medium leading-[1.55] text-bone-dim'>
          Los primeros trabajos bajo el nombre The Firm, allá por 2007 — la marca
          de skate, el cantor, los cracks del team. De vuelta como prototipos,
          veinte años después.
        </p>
        <motion.div
          className='grid grid-cols-1 gap-5 bp:grid-cols-2 bp:gap-6'
          variants={stagger}
          initial='hidden'
          whileInView='show'
          viewport={inView}
        >
          {experiments.map((exp) => (
            <ExpCard key={exp.name} exp={exp} />
          ))}
        </motion.div>
      </Wrap>
    </section>
  )
}
