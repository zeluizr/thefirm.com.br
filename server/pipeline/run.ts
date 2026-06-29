import type { Category, Prisma } from '@prisma/client'

import { generatePost } from '../generator/generate'
import { GENERATOR_VERSION } from '../lib/constants'
import { db } from '../lib/db'
import { uniqueSlug } from '../lib/slug'
import { generateImage } from '../media/image'
import { generateVideo } from '../media/video'
import { logSafetyGate, runClassifierGate } from '../moderation'
import { notifyPost } from '../telegram/notify'

function log(msg: string): void {
  console.log(`[pipeline] ${msg}`)
}

function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

// já houve geração hoje? (1 post/dia no total — addendum §C)
async function alreadyRanToday(): Promise<boolean> {
  const count = await db.post.count({ where: { createdAt: { gte: startOfToday() } } })
  return count > 0
}

// LRU: categoria habilitada menos recentemente postada (nulls primeiro)
export async function pickCategory(): Promise<Category | null> {
  return db.category.findFirst({
    where: { enabled: true },
    orderBy: [{ lastPostedAt: { sort: 'asc', nulls: 'first' } }, { createdAt: 'asc' }],
  })
}

export async function fetchBlocklist(): Promise<string[]> {
  const terms = await db.blocklistTerm.findMany({ select: { value: true } })
  return terms.map((t) => t.value)
}

// usado pelo botão "gerar agora" do admin — ignora a idempotência do dia
export async function forceDailyPost(): Promise<PipelineResult> {
  const category = await pickCategory()
  if (!category) return { status: 'skipped', reason: 'sem categoria habilitada' }
  log(`[force] categoria escolhida: ${category.name}`)
  return runForCategory(category, await fetchBlocklist())
}

export type PipelineResult =
  | { status: 'skipped'; reason: string }
  | { status: 'rejected'; postId: string; reason: string }
  | { status: 'error'; reason: string }
  | { status: 'published-pending'; postId: string }

// entrypoint do dia: escolhe UMA categoria e roda o fluxo completo
export async function runDailyPost(): Promise<PipelineResult> {
  if (await alreadyRanToday()) {
    log('já existe post criado hoje — pulando (idempotência)')
    return { status: 'skipped', reason: 'já rodou hoje' }
  }

  const category = await pickCategory()
  if (!category) {
    log('nenhuma categoria habilitada')
    return { status: 'skipped', reason: 'sem categoria habilitada' }
  }

  log(`categoria escolhida: ${category.name}`)
  const blocklist = await fetchBlocklist()
  return runForCategory(category, blocklist)
}

// fluxo de uma categoria: gerar → moderar → imagem → vídeo? → notificar
export async function runForCategory(
  category: Category,
  blocklist: string[],
): Promise<PipelineResult> {
  const gen = await generatePost(category, blocklist)

  // texto bloqueado por safety (gate 1) → grava REJECTED pra auditoria + log
  if (!gen.ok && gen.safetyBlocked) {
    const post = await db.post.create({
      data: {
        categoryId: category.id,
        title: '[texto bloqueado pela moderação]',
        slug: uniqueSlug('bloqueado'),
        summary: gen.reason,
        body: gen.raw.slice(0, 2000),
        status: 'REJECTED',
        moderationReason: gen.reason,
        moderationScores: gen.safety as Prisma.InputJsonValue,
        generatorVersion: GENERATOR_VERSION,
      },
    })
    await logSafetyGate(post.id, gen.safety, false)
    await touchCategory(category.id)
    log(`REJECTED (gate 1 safety): ${gen.reason}`)
    return { status: 'rejected', postId: post.id, reason: gen.reason }
  }

  // erro de geração/parse → loga e sai sem post (não derruba o cron — §12)
  if (!gen.ok) {
    log(`erro de geração: ${gen.reason}`)
    return { status: 'error', reason: gen.reason }
  }

  // cria o rascunho em GENERATING_MEDIA e marca a categoria como postada
  const post = await db.post.create({
    data: {
      categoryId: category.id,
      title: gen.post.title,
      slug: uniqueSlug(gen.post.title),
      summary: gen.post.summary,
      body: gen.post.body,
      tags: gen.post.tags,
      imagePrompt: gen.post.imagePrompt,
      status: 'GENERATING_MEDIA',
      moderationScores: { safety: gen.safety } as Prisma.InputJsonValue,
      generatorVersion: GENERATOR_VERSION,
    },
  })
  await touchCategory(category.id)
  log(`post ${post.id} criado (${post.slug})`)

  // gate 1: registra o veredito de safety da geração (passou)
  await logSafetyGate(post.id, gen.safety, true)

  // gate 2: classificador
  const gate2 = await runClassifierGate(post.id, post.title, post.body, blocklist)
  if (!gate2.passed) {
    await db.post.update({
      where: { id: post.id },
      data: { status: 'REJECTED', moderationReason: gate2.reason },
    })
    log(`REJECTED (gate 2 classificador): ${gate2.reason}`)
    return { status: 'rejected', postId: post.id, reason: gate2.reason }
  }

  // imagem (default). falha não derruba — segue sem imagem e notifica mesmo assim
  const image = await generateImage(post.imagePrompt ?? gen.post.imagePrompt, post.id)
  if (image.ok) {
    await db.post.update({ where: { id: post.id }, data: { imageUrl: image.url } })
    log('imagem gerada')
  } else {
    log(`imagem falhou (${image.reason}) — seguindo sem imagem`)
  }

  // vídeo opcional (Veo + polling). falha → cai pra imagem
  if (category.videoEnabled) {
    log('vídeo habilitado — gerando via Veo (pode levar minutos)')
    const video = await generateVideo(post.imagePrompt ?? gen.post.imagePrompt, post.id)
    if (video.ok) {
      await db.post.update({ where: { id: post.id }, data: { videoUrl: video.url } })
      log('vídeo gerado')
    } else {
      log(`vídeo falhou (${video.reason}) — caindo pra imagem`)
    }
  }

  // mídia pronta → PENDING_REVIEW e manda pro Telegram
  await db.post.update({ where: { id: post.id }, data: { status: 'PENDING_REVIEW' } })

  try {
    await notifyPost(post.id)
    log('notificado no Telegram')
  } catch (e) {
    log(`falha ao notificar no Telegram: ${(e as Error).message}`)
  }

  return { status: 'published-pending', postId: post.id }
}

async function touchCategory(categoryId: string): Promise<void> {
  await db.category.update({
    where: { id: categoryId },
    data: { lastPostedAt: new Date() },
  })
}
