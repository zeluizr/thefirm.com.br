import type { Category } from '@prisma/client'
import { z } from 'zod'

import { GENERATOR_VERSION } from '../lib/constants'
import { db } from '../lib/db'
import { gemini, safetyScores, safetyVerdict, STRICT_SAFETY } from '../lib/gemini'
import { parseJsonLoose } from '../lib/json'
import { buildGeneratorPrompt } from './prompt'

const GeneratedSchema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().min(1).max(500),
  body: z.string().min(1),
  tags: z.array(z.string()).default([]),
  imagePrompt: z.string().min(1),
})

export type GeneratedPost = z.infer<typeof GeneratedSchema>

export type GenerateResult =
  | { ok: true; post: GeneratedPost; raw: string; safety: Record<string, unknown> }
  | {
      ok: false
      reason: string
      raw: string
      safetyBlocked: boolean
      safety: Record<string, unknown>
    }

type CategoryInput = Pick<Category, 'name' | 'promptHints' | 'language'>

export async function generatePost(
  category: CategoryInput,
  blocklist: string[],
): Promise<GenerateResult> {
  const language = category.language || 'pt-BR'
  const prompt = buildGeneratorPrompt(category, blocklist, language)

  let raw = ''
  try {
    const { ai, textModel } = await gemini()
    const res = await ai.models.generateContent({
      model: textModel,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        safetySettings: STRICT_SAFETY,
        temperature: 0.9,
      },
    })
    raw = res.text ?? ''

    // auditoria: grava o output cru com a versão do prompt (CLAUDE.md §5.1)
    await db.generationLog.create({
      data: {
        category: category.name,
        model: textModel,
        version: GENERATOR_VERSION,
        rawOutput: raw,
      },
    })

    const safety = safetyScores(res)

    // gate 1 de moderação já na geração (addendum §G)
    const verdict = safetyVerdict(res)
    if (verdict.blocked) {
      return { ok: false, reason: verdict.reason, raw, safetyBlocked: true, safety }
    }

    const parsed = parseJsonLoose(raw)
    if (!parsed) {
      return {
        ok: false,
        reason: 'JSON inválido do gerador',
        raw,
        safetyBlocked: false,
        safety,
      }
    }

    const v = GeneratedSchema.safeParse(parsed)
    if (!v.success) {
      return {
        ok: false,
        reason: `shape inválido: ${v.error.issues.map((i) => i.path.join('.')).join(', ')}`,
        raw,
        safetyBlocked: false,
        safety,
      }
    }

    return { ok: true, post: v.data, raw, safety }
  } catch (e) {
    return {
      ok: false,
      reason: `erro na geração: ${(e as Error).message}`,
      raw,
      safetyBlocked: false,
      safety: {},
    }
  }
}
