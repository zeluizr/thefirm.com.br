// Smoke-test posts for the fotolog home. Placeholder images + PT captions so we
// can see the layout before the real posts arrive. Each is run through the
// publisher in DRY_RUN, so it ends up `completed` with mock platform links.
// Usage: npm run seed:fotolog
import { getPool } from '../app/services/db.server'
import * as media from '../app/services/media.server'
import { processMediaItem } from '../app/services/publisher.server'
import type { Platform } from '../app/services/types'

interface Sample {
  title: string
  caption: string
  ratio: '1/1' | '4/5' | '3/4'
  platforms: Platform[]
}

const W = 1080
const dims: Record<Sample['ratio'], [number, number]> = {
  '1/1': [W, W],
  '4/5': [W, Math.round((W * 5) / 4)],
  '3/4': [W, Math.round((W * 4) / 3)],
}

// Oldest first so created_at increases and the last one is the newest "herói".
const samples: Sample[] = [
  { title: 'Catedral de circuitos', caption: 'Sonhei com uma catedral feita de placas-mãe. O Outro José rezava em binário. #loucura #ia', ratio: '4/5', platforms: ['x', 'instagram', 'threads'] },
  { title: 'Peixe-neon no asfalto', caption: 'Um cardume atravessou a avenida às 3 da manhã. Ninguém viu, só a máquina. #ia #thefirm', ratio: '1/1', platforms: ['instagram', 'threads'] },
  { title: 'Retrato do Outro José', caption: 'A IA tentou me desenhar. Saiu isso. Acho que ela me conhece melhor que eu. #ooutrojose', ratio: '3/4', platforms: ['x', 'instagram', 'facebook', 'threads'] },
  { title: 'Jardim que respira', caption: 'Plantas de vidro soprado, pólen de estática. O jardim respirava no ritmo do meu modem. #loucura', ratio: '4/5', platforms: ['instagram'] },
  { title: 'Tempestade de tipografia', caption: 'Choveu Archivo Black sobre a cidade. As letras afundaram no concreto roxo. #ia #fotolog', ratio: '1/1', platforms: ['x', 'threads'] },
  { title: 'Skeleton DJ', caption: 'O esqueleto puxou o vinil e o void inteiro começou a pulsar magenta. #thefirm #loucura', ratio: '3/4', platforms: ['x', 'instagram', 'threads'] },
  { title: 'Mapa de um sonho', caption: 'Tracei o mapa do sonho de ontem. Tinha um rio onde deveria ter uma rua. #ia', ratio: '4/5', platforms: ['instagram', 'facebook', 'threads'] },
  { title: 'Lua de porcelana', caption: 'A lua rachou e dentro dela tinha outra lua, menor, sorrindo. #ooutrojose #loucura', ratio: '1/1', platforms: ['x', 'instagram', 'threads'] },
  { title: 'O último frame', caption: 'A transmissão fechou com este quadro. O Outro José acenou e desligou a tela. #thefirm #ia', ratio: '3/4', platforms: ['x', 'instagram', 'facebook', 'threads'] },
]

async function main() {
  let n = 0
  for (const s of samples) {
    const [w, h] = dims[s.ratio]
    const slug = `loucura-${String(n + 1).padStart(3, '0')}`
    const item = await media.createMediaItem({
      title: s.title,
      caption: s.caption,
      mediaUrl: `https://picsum.photos/seed/firm-${slug}/${w}/${h}`,
      mediaType: 'image',
      platforms: s.platforms,
      slug,
    })
    await media.setItemStatus(item.id, 'ready')
    await processMediaItem(item.id, { trigger: 'seed' }) // DRY_RUN → completed
    n += 1
    console.log(`  ${slug}  ${s.title}`)
  }
  console.log(`\nSeeded ${n} fotolog posts (placeholders).`)
  await getPool().end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
