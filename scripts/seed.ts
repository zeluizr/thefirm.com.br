// Seeds a few sample media items so the admin isn't empty.
// One item is run through the publisher (DRY_RUN-safe) so the public archive
// has content to show. Usage: npm run seed
import { getPool } from '../app/services/db.server'
import * as media from '../app/services/media.server'
import { processMediaItem } from '../app/services/publisher.server'

async function main() {
  const draft = await media.createMediaItem({
    title: 'Fragmento 001 — sinal de teste',
    caption: 'O Outro José aparece. Primeiro sinal. #thefirm',
    mediaUrl: 'https://picsum.photos/seed/firm-001/1080/1080',
    mediaType: 'image',
    platforms: ['x', 'threads'],
  })

  const scheduled = await media.createMediaItem({
    title: 'Fragmento 002 — transmissão noturna',
    caption: 'Algo se move no arquivo. #thefirm #ooutrojose',
    mediaUrl: 'https://picsum.photos/seed/firm-002/1080/1350',
    mediaType: 'image',
    platforms: ['instagram', 'facebook', 'x', 'threads'],
    publishAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
  })
  await media.setItemStatus(scheduled.id, 'scheduled')

  const published = await media.createMediaItem({
    title: 'Fragmento 000 — manifesto visual',
    caption: 'No princípio havia um domínio. thefirm.com.br renasce.',
    mediaUrl: 'https://picsum.photos/seed/firm-000/1080/1080',
    mediaType: 'image',
    platforms: ['x', 'instagram', 'threads'],
  })
  await media.setItemStatus(published.id, 'ready')
  // With DRY_RUN on (default) this simulates the publish and completes the item.
  await processMediaItem(published.id, { trigger: 'seed' })

  console.log('Seeded media items:')
  console.log(`  draft      ${draft.slug}`)
  console.log(`  scheduled  ${scheduled.slug}`)
  console.log(`  completed  ${published.slug}`)

  await getPool().end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
