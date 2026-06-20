import { motion } from 'framer-motion'
import { Link } from 'react-router'

import { Eyebrow } from '~/components/Eyebrow'
import { Spoiler } from '~/components/Spoiler'
import { Wrap } from '~/components/Wrap'
import { reveal, stagger } from '~/lib/motion'

import type { Route } from './+types/manifiesto'

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'manifiesto — the firm' },
    {
      name: 'description',
      content:
        'thefirm.com.br — un documento sin permiso. músico, skater, y de vuelta a la web por la escena.',
    },
  ]
}

export default function Manifiesto() {
  return (
    <main className='relative pt-[clamp(40px,7vw,80px)] pb-24 bp:pb-32'>
      <Wrap>
        <motion.div variants={stagger} initial='hidden' animate='show'>
          <motion.div variants={reveal} className='mb-10'>
            <Link
              to='/'
              className='inline-flex items-center gap-2 font-mono text-[13px] uppercase tracking-[2px] text-bone-dim no-underline transition-colors duration-150 hover:text-magenta motion-reduce:transition-none'
            >
              ← volver
            </Link>
          </motion.div>

          <motion.div variants={reveal} className='mb-6'>
            <Eyebrow>documento sin permiso · 20/03/2027</Eyebrow>
          </motion.div>

          <motion.h1
            variants={reveal}
            className='glitch font-display text-[clamp(56px,13vw,150px)] uppercase leading-[0.82] tracking-[-0.03em]'
          >
            mani
            <br />
            fiesto<span className='text-wire'>.</span>
          </motion.h1>

          <motion.div
            variants={reveal}
            className='mt-12 max-w-180 space-y-7 text-[clamp(18px,2.2vw,22px)] font-medium leading-[1.5]'
          >
            <p>
              Soy <b className='bg-magenta px-1 font-bold text-void'>músico</b>.
              Soy <b className='bg-magenta px-1 font-bold text-void'>skater</b>.
              Eso vino primero y va a quedar.
            </p>
            <p>
              Este es el dominio más viejo que tengo. Lo dejé prendido veinte
              años, renovación tras renovación, sin nada adentro. Ahora hace lo
              que se le canta.
            </p>
            <p>
              La idea es simple: tengo ideas y sé armar sitios. Hay gente con
              talento y sin un lugar en la web. Puedo armárselo. Gratis. Porque
              sí.
            </p>
            <p>
              Estos cuatro sitios — <b className='text-bone'>Plasma</b>,{' '}
              <b className='text-bone'>AfroX</b>,{' '}
              <b className='text-bone'>Denis Buiu</b> y{' '}
              <b className='text-bone'>Fabio Sleiman</b> — son los primeros. La
              marca, el cantor y los cracks del team. De vuelta, veinte años
              después.
            </p>
          </motion.div>

          {/* el regalo del aniversario, tapado hasta que lo destapás */}
          <motion.div
            variants={reveal}
            className='mt-14 border-[3px] border-bone bg-void-2 p-7 shadow-hard bp:mt-16 bp:p-10'
          >
            <p className='font-mono text-[12px] uppercase tracking-[2px] text-bone-dim'>
              spoiler · el 20/03/2027 · tocá para revelar
            </p>
            <p className='mt-5 text-[clamp(20px,3.4vw,32px)] font-bold leading-[1.35]'>
              <Spoiler className='spoiler--magenta spoiler--block'>
                una app gratis para que cualquier músico o skater arme su propio
                sitio: elegís un layout, ponés tus datos, y queda online. sin
                código, sin costo, sin pedir permiso.
              </Spoiler>
            </p>
          </motion.div>

          <motion.div
            variants={reveal}
            className='mt-14 border-t-[3px] border-bone pt-8 bp:mt-16'
          >
            <p className='font-display text-[clamp(24px,4.5vw,44px)] uppercase leading-none tracking-[-0.02em]'>
              sin clientes.
              <br />
              sin facturas.
              <br />
              sin jefes.
            </p>
            <p className='mt-6 max-w-160 font-medium leading-[1.5] text-bone-dim'>
              Solo la escena y lo que se me cante construir. The Firm no le debe
              nada a nadie.
            </p>
            <p className='mt-8 font-mono text-[13px] uppercase tracking-[2px] text-magenta'>
              — the firm · são paulo → santiago · todavía rodando
            </p>
          </motion.div>
        </motion.div>
      </Wrap>
    </main>
  )
}
