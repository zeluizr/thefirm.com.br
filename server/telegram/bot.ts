import { Bot, type Context } from 'grammy'

import { runtimeConfig } from '../lib/config'
import { db } from '../lib/db'
import {
  buildCaption,
  categoryKeyboard,
  mainKeyboard,
  withStatus,
  type InlineKeyboard,
} from './format'

// token vem do config (banco > env); recria o bot se a chave mudar
let _bot: { token: string; bot: Bot } | undefined

export async function getBot(): Promise<Bot> {
  const cfg = await runtimeConfig()
  if (!cfg.telegramBotToken) {
    throw new Error('TELEGRAM_BOT_TOKEN não configurado — defina em /admin/settings')
  }
  if (!_bot || _bot.token !== cfg.telegramBotToken) {
    const bot = new Bot(cfg.telegramBotToken)
    registerHandlers(bot)
    // um erro num único update (ex.: callback velho) não pode derrubar o bot
    bot.catch((err) => {
      const e = err.error
      console.error('[bot] erro no handler:', e instanceof Error ? e.message : e)
    })
    _bot = { token: cfg.telegramBotToken, bot }
  }
  return _bot.bot
}

// grammY exige init (botInfo) antes de processar updates no modo webhook
export async function ensureBotReady(): Promise<Bot> {
  const bot = await getBot()
  if (!bot.isInited()) await bot.init()
  return bot
}

// edita caption (mensagem de mídia) e cai pra texto se não houver mídia
async function editMessage(
  ctx: Context,
  text: string,
  reply_markup?: InlineKeyboard,
): Promise<void> {
  try {
    await ctx.editMessageCaption({ caption: text, reply_markup })
  } catch {
    try {
      await ctx.editMessageText(text, { reply_markup })
    } catch {
      // mensagem pode ter sido apagada — ignora
    }
  }
}

function registerHandlers(bot: Bot): void {
  bot.on('callback_query:data', async (ctx) => {
    // segurança: só o admin pode acionar botões (CLAUDE.md §6)
    const fromId = String(ctx.from?.id ?? '')
    const cfg = await runtimeConfig()
    if (cfg.telegramAdminId && fromId !== cfg.telegramAdminId) {
      await ctx.answerCallbackQuery({ text: 'não autorizado', show_alert: true })
      return
    }

    const [action, postId, extra] = ctx.callbackQuery.data.split(':')

    const post = await db.post.findUnique({
      where: { id: postId },
      include: { category: true },
    })
    if (!post) {
      await ctx.answerCallbackQuery({ text: 'post não encontrado', show_alert: true })
      return
    }

    const baseCaption = buildCaption(post, post.category.name)

    switch (action) {
      case 'approve': {
        await db.post.update({
          where: { id: post.id },
          data: { status: 'PUBLISHED', publishedAt: new Date() },
        })
        await editMessage(ctx, withStatus(baseCaption, '✅ Publicado'))
        await ctx.answerCallbackQuery({ text: 'publicado ✅' })
        return
      }

      case 'reject': {
        await db.post.update({
          where: { id: post.id },
          data: { status: 'REJECTED' },
        })
        await editMessage(ctx, withStatus(baseCaption, '🗑️ Rejeitado'))
        await ctx.answerCallbackQuery({ text: 'rejeitado 🗑️' })
        return
      }

      case 'recat': {
        const categories = await db.category.findMany({
          where: { enabled: true },
          orderBy: { name: 'asc' },
          select: { id: true, name: true },
        })
        await editMessage(
          ctx,
          withStatus(baseCaption, '🔁 Escolha a nova categoria:'),
          categoryKeyboard(post.id, categories),
        )
        await ctx.answerCallbackQuery()
        return
      }

      case 'setcat': {
        const category = await db.category.findUnique({ where: { id: extra } })
        if (!category) {
          await ctx.answerCallbackQuery({ text: 'categoria inválida', show_alert: true })
          return
        }
        const updated = await db.post.update({
          where: { id: post.id },
          data: { categoryId: category.id, status: 'PENDING_REVIEW' },
          include: { category: true },
        })
        await editMessage(
          ctx,
          buildCaption(updated, updated.category.name),
          mainKeyboard(post.id),
        )
        await ctx.answerCallbackQuery({ text: `categoria: ${category.name}` })
        return
      }

      case 'back': {
        await editMessage(ctx, baseCaption, mainKeyboard(post.id))
        await ctx.answerCallbackQuery()
        return
      }

      default: {
        await ctx.answerCallbackQuery()
        return
      }
    }
  })
}
