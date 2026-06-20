import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, FlaskConical } from 'lucide-react'

import { Eyebrow } from './Eyebrow'
import { Wrap } from './Wrap'

type Experiment = {
  name: string
  what: string
  meta: string
  href: string
}

// links point to GitHub as placeholders until each project gets its own home —
// palta is already published to npm
const experiments: Experiment[] = [
  {
    name: 'palta',
    what: 'Validación y formato para datos latinoamericanos: CPF, CNPJ, RUT, CUIT, NIT, RUC, monedas, teléfonos y códigos postales.',
    meta: 'lib · latam',
    href: 'https://www.npmjs.com/package/@zeluizr/palta',
  },
  {
    name: 'vtex-io-mcp',
    what: 'Servidor MCP para desarrollo en VTEX IO: Store Framework, React, servicios Node y soporte GraphQL.',
    meta: 'mcp · server',
    href: 'https://github.com/zeluizr',
  },
  {
    name: 'vtex-io-snippets',
    what: 'Extensión de VS Code con autocompletado, IntelliSense y snippets para bloques de VTEX IO Store Framework, con validación de props anidadas.',
    meta: 'vscode · ext',
    href: 'https://github.com/zeluizr',
  },
  {
    name: 'vtex-snap',
    what: 'CLI para clonar el catálogo completo de una tienda VTEX a otra.',
    meta: 'cli',
    href: 'https://github.com/zeluizr',
  },
  {
    name: 'ai-cost-proxy',
    what: 'Proxy en Cloudflare Workers que registra tokens y costo de IA por equipo y caso de uso, con topes mensuales, alertas y dashboard.',
    meta: 'cloudflare',
    href: 'https://github.com/zeluizr',
  },
  {
    name: 'prompt-snap',
    what: 'Herramienta web para estimar el costo de prompts en modelos de IA con precios en tiempo real de la API de OpenRouter.',
    meta: 'web · tool',
    href: 'https://github.com/zeluizr',
  },
]

function ExpCard({ exp }: { exp: Experiment }) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.a
      href={exp.href}
      target='_blank'
      rel='noopener'
      className='group relative flex min-h-[150px] flex-col border-[3px] border-bone p-[22px] no-underline'
      style={{ backgroundColor: '#1c1526', boxShadow: '4px 4px 0 #ff41b4' }}
      whileHover={
        reduceMotion
          ? undefined
          : {
              x: -3,
              y: -3,
              boxShadow: '7px 7px 0 #ff41b4',
              backgroundColor: '#271c33',
            }
      }
      whileTap={
        reduceMotion ? undefined : { x: 2, y: 2, boxShadow: '1px 1px 0 #ff41b4' }
      }
    >
      <ArrowUpRight
        className='absolute right-[16px] top-[16px] text-bone-dim opacity-0 transition-opacity duration-150 group-hover:opacity-100 motion-reduce:transition-none'
        size={18}
        strokeWidth={2.5}
        aria-hidden='true'
      />
      <div className='font-display text-[24px] lowercase tracking-[-0.01em] text-bone'>
        {exp.name}
      </div>
      <div className='mt-2 flex-1 text-[16px] font-medium text-bone-dim'>
        {exp.what}
      </div>
      <div className='mt-[14px] font-mono text-[11px] uppercase tracking-[1px] text-bone-dim group-hover:text-magenta motion-reduce:group-hover:text-bone-dim'>
        {exp.meta}
      </div>
    </motion.a>
  )
}

export function Lab() {
  return (
    <section id='lab' className='py-[84px]'>
      <Wrap>
        <div className='mb-11'>
          <Eyebrow icon={FlaskConical}>el laboratorio</Eyebrow>
          <h2 className='glitch mt-4 font-display text-[clamp(34px,6vw,64px)] uppercase leading-[0.9] tracking-[-0.02em]'>
            experimentos
            <br />
            sueltos
          </h2>
        </div>
        <p className='mb-[38px] max-w-[560px] font-medium text-bone-dim'>
          Cosas que construí porque me dieron ganas. Algunas se vuelven producto,
          otras aprendizaje — y está bien.
        </p>
        <div className='grid grid-cols-1 gap-5 bp:grid-cols-3'>
          {experiments.map((exp) => (
            <ExpCard key={exp.name} exp={exp} />
          ))}
        </div>
      </Wrap>
    </section>
  )
}
