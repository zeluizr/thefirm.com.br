import { motion } from 'framer-motion'
import { Link } from 'react-router'

import { Eyebrow } from '~/components/Eyebrow'
import { Spoiler } from '~/components/Spoiler'
import { Wrap } from '~/components/Wrap'
import { reveal, stagger } from '~/lib/motion'

import type { Route } from './+types/manifiesto'

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'manifesto — the firm' },
    {
      name: 'description',
      content:
        'thefirm.com.br — o manifesto de O Outro José. Um fotolog de loucuras geradas por IA, sem cliente e sem permissão.',
    },
  ]
}

export default function Manifiesto() {
  return (
    <main className="relative pt-[clamp(40px,7vw,80px)] pb-24 bp:pb-32">
      <Wrap>
        <motion.div variants={stagger} initial="hidden" animate="show">
          <motion.div variants={reveal} className="mb-10">
            <Link
              to="/"
              className="inline-flex items-center gap-2 font-mono text-[13px] uppercase tracking-[2px] text-bone-dim no-underline transition-colors duration-150 hover:text-magenta motion-reduce:transition-none"
            >
              ← voltar
            </Link>
          </motion.div>

          <motion.div variants={reveal} className="mb-6">
            <Eyebrow>documento sem permissão · o outro josé</Eyebrow>
          </motion.div>

          <motion.h1
            variants={reveal}
            className="glitch font-display text-[clamp(56px,13vw,150px)] uppercase leading-[0.82] tracking-[-0.03em]"
          >
            mani
            <br />
            festo<span className="text-wire">.</span>
          </motion.h1>

          <motion.div
            variants={reveal}
            className="mt-12 max-w-180 space-y-7 text-[clamp(18px,2.2vw,22px)] font-medium leading-[1.5]"
          >
            <p>
              Eu sou <b className="bg-magenta px-1 font-bold text-void">O Outro José</b> — o
              que sobra quando o trabalho acaba e a máquina continua sonhando.
            </p>
            <p>
              Este é o domínio mais velho que tenho. Fiquei vinte anos renovando ele sem nada
              dentro. Agora ele virou um <b className="text-bone">fotolog de IA</b>: um mural
              das minhas loucuras.
            </p>
            <p>
              A ideia é simples. Eu tenho uma imagem na cabeça, peço pra máquina, e ela me
              devolve algo torto, bonito, estranho. Eu escrevo uma legenda e transmito. Sem
              cliente, sem briefing, sem alguém pra agradar.
            </p>
            <p>
              Não é portfólio. Não é produto. São{' '}
              <b className="text-bone">loucuras</b> — o que aparece quando você deixa o
              algoritmo sonhar e não tem vergonha de mostrar.
            </p>
          </motion.div>

          {/* a regra única, tapada até você tocar */}
          <motion.div
            variants={reveal}
            className="mt-14 border-[3px] border-bone bg-void-2 p-7 shadow-hard bp:mt-16 bp:p-10"
          >
            <p className="font-mono text-[12px] uppercase tracking-[2px] text-bone-dim">
              a regra única · toque para revelar
            </p>
            <p className="mt-5 text-[clamp(20px,3.4vw,32px)] font-bold leading-[1.35]">
              <Spoiler className="spoiler--magenta spoiler--block">
                publicar antes de pensar demais. a dúvida mata a loucura — então a imagem sai
                crua, do jeito que a máquina cuspiu.
              </Spoiler>
            </p>
          </motion.div>

          <motion.div
            variants={reveal}
            className="mt-14 border-t-[3px] border-bone pt-8 bp:mt-16"
          >
            <p className="font-display text-[clamp(24px,4.5vw,44px)] uppercase leading-none tracking-[-0.02em]">
              sem cliente.
              <br />
              sem briefing.
              <br />
              sem freio.
            </p>
            <p className="mt-6 max-w-160 font-medium leading-[1.5] text-bone-dim">
              Só eu, a máquina, e o que O Outro José resolve transmitir. The Firm não deve nada
              a ninguém.
            </p>
            <p className="mt-8 font-mono text-[13px] uppercase tracking-[2px] text-magenta">
              — the firm · o fotolog de o outro josé · transmissão contínua
            </p>
          </motion.div>
        </motion.div>
      </Wrap>
    </main>
  )
}
