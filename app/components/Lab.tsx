import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'

import { SectionHead } from './SectionHead'
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
      className='group relative flex min-h-[160px] flex-col border-[3px] border-bone p-6 no-underline'
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
      <div className='font-display text-[24px] lowercase leading-[1.05] tracking-[-0.01em] text-bone'>
        {exp.name}
      </div>
      <div className='mt-2 flex-1 text-[15px] font-medium leading-[1.5] text-bone-dim'>
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
    <section id='lab' className='py-20 bp:py-[120px]'>
      <Wrap>
        <SectionHead
          eyebrow='el laboratorio'
          count='06 proyectos'
          title={
            <>
              experimentos
              <br />
              sueltos
            </>
          }
        />
        <p className='mb-10 max-w-[560px] font-medium leading-[1.55] text-bone-dim'>
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
