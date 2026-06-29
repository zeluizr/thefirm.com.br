import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'

import { Eyebrow } from '~/components/Eyebrow'
import { Footer } from '~/components/Footer'
import { Wrap } from '~/components/Wrap'
import { easeOut, inView, reveal, stagger } from '~/lib/motion'

import type { Route } from './+types/about'

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'the firm — conceito' },
    {
      name: 'description',
      content:
        'The Firm Social Publisher: um estúdio editorial privado para publicar mídia e legenda nas redes, sob a persona O Outro José.',
    },
  ]
}

const principles = [
  {
    k: '01',
    title: 'Mídia primeiro',
    body: 'Não é blog, não é CMS. A unidade é imagem ou vídeo, uma legenda, plataformas e estado. Nada mais.',
  },
  {
    k: '02',
    title: 'APIs oficiais',
    body: 'X, Instagram, Facebook Page e Threads — sempre via API oficial. Sem automação de navegador, sem atalhos.',
  },
  {
    k: '03',
    title: 'Persona única',
    body: 'Tudo sai assinado por O Outro José: uma voz, um arquivo, uma intenção editorial contínua.',
  },
  {
    k: '04',
    title: 'Fila previsível',
    body: 'Rascunho → pronto → agendado → publicando → concluído. Um worker processa o que está pronto ou venceu.',
  },
]

export default function About() {
  return (
    <>
      <main className="pt-20 pb-24 bp:pt-28">
        <Wrap>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={easeOut}>
            <Link
              to="/"
              className="inline-flex items-center gap-2 font-mono text-[13px] uppercase tracking-[2px] text-bone-dim no-underline transition-colors hover:text-magenta motion-reduce:transition-none"
            >
              <ArrowLeft size={14} strokeWidth={2.5} aria-hidden="true" />
              voltar
            </Link>

            <div className="mt-10 bp:mt-14">
              <Eyebrow>conceito · the firm social publisher</Eyebrow>
              <h1 className="glitch mt-5 max-w-4xl font-display text-[clamp(40px,8vw,104px)] uppercase leading-[0.84] tracking-[-0.03em]">
                um estúdio<br />
                editorial<br />
                <span className="text-wire">privado.</span>
              </h1>
            </div>

            <p className="mt-10 max-w-2xl font-body text-[clamp(17px,2.4vw,22px)] leading-[1.55] text-bone-dim bp:mt-12">
              The Firm Social Publisher é uma redação de uma pessoa só. Você sobe uma mídia,
              escreve a legenda, escolhe as redes e o momento — o sistema cuida do resto, com
              estado por plataforma, registros claros e nenhum truque.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={inView}
            className="mt-20 grid gap-px overflow-hidden border-[3px] border-bone bg-bone bp:mt-28 bp:grid-cols-2"
          >
            {principles.map((p) => (
              <motion.div key={p.k} variants={reveal} className="bg-void-2 p-8 bp:p-10">
                <span className="font-mono text-[13px] uppercase tracking-[3px] text-magenta">
                  {p.k}
                </span>
                <h2 className="mt-4 font-display text-[clamp(22px,3vw,32px)] uppercase leading-[0.95] tracking-[-0.01em]">
                  {p.title}
                </h2>
                <p className="mt-3 max-w-md text-[15px] leading-[1.6] text-bone-dim">{p.body}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={inView}
            transition={easeOut}
            className="mt-20 flex flex-wrap items-center gap-4 bp:mt-28"
          >
            <Link
              to="/archive"
              className="inline-flex items-center gap-2 border-2 border-bone bg-magenta px-4 py-2.5 font-mono text-[13px] uppercase leading-none tracking-[1px] text-void no-underline transition-colors hover:bg-bone motion-reduce:transition-none"
            >
              ver o arquivo
            </Link>
            <Link
              to="/manifiesto"
              className="inline-flex items-center gap-2 border-2 border-bone px-4 py-2.5 font-mono text-[13px] uppercase leading-none tracking-[1px] no-underline transition-colors hover:bg-magenta hover:text-void motion-reduce:transition-none"
            >
              manifiesto
            </Link>
          </motion.div>
        </Wrap>
      </main>
      <Footer />
    </>
  )
}
