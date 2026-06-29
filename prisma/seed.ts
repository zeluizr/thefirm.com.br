import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// categorias iniciais (CLAUDE.md §3). vídeo desligado em todas — ligue 1 ou 2
// depois de calibrar o tom (recomendação do addendum §I).
const categories = [
  {
    slug: 'ia',
    name: 'IA',
    promptHints:
      'modelos, agentes, prompts, ferramentas de dev com IA. tom curioso e prático, sem hype vazio.',
  },
  {
    slug: 'javascript',
    name: 'JavaScript',
    promptHints:
      'truques da linguagem, runtime, ecossistema, novidades do TC39. exemplos curtos e diretos.',
  },
  {
    slug: 'vtex',
    name: 'VTEX',
    promptHints:
      'IO, FastStore, headless, marketplace, payments. visão de quem constrói loja de verdade.',
  },
  {
    slug: 'react',
    name: 'React',
    promptHints: 'hooks, padrões, performance, server components. opinião de quem usa no dia a dia.',
  },
  {
    slug: 'react-router',
    name: 'React Router',
    promptHints: 'framework mode v7, loaders/actions, nested routes, data APIs.',
  },
  {
    slug: 'react-native',
    name: 'React Native',
    promptHints: 'mobile, expo, performance, gestos e animação, publicação nas lojas.',
  },
  {
    slug: 'cloud',
    name: 'Cloud',
    promptHints: 'deploy, edge, serverless, containers, custo e DX. Railway, Cloudflare, etc.',
  },
  {
    slug: 'skate',
    name: 'Skate',
    promptHints: 'cultura, manobras, setups, história do skate. voz pessoal e descontraída.',
  },
  {
    slug: 'musica',
    name: 'Música',
    promptHints: 'foco em Rock no começo. bandas, discos, história, cultura. paixão de fã.',
  },
  {
    slug: 'video-game',
    name: 'Video Game',
    promptHints: 'jogos, design, nostalgia, indie e clássicos. curiosidade e opinião.',
  },
  {
    slug: 'arduino',
    name: 'Arduino',
    promptHints: 'robótica e eletrônica maker em geral. projetos, sensores, microcontroladores.',
  },
]

async function main() {
  for (const c of categories) {
    await db.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, promptHints: c.promptHints },
      create: {
        slug: c.slug,
        name: c.name,
        promptHints: c.promptHints,
        enabled: true,
        videoEnabled: false,
        language: 'pt-BR',
      },
    })
  }
  console.log(`seed: ${categories.length} categorias garantidas`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
