import { z } from 'zod'

import { gemini, safetyVerdict, STRICT_SAFETY } from '../lib/gemini'
import { parseJsonLoose } from '../lib/json'
import { buildClassifierPrompt } from './prompt'

const ClassifierSchema = z.object({
  approved: z.boolean(),
  reason: z.string().default(''),
})

export type ClassifyResult = {
  approved: boolean
  reason: string
  scores: Record<string, unknown>
}

// gate 2: segunda passada no Gemini, retorna { approved, reason } (addendum §G)
export async function classify(
  title: string,
  body: string,
  blocklist: string[],
): Promise<ClassifyResult> {
  const prompt = buildClassifierPrompt(title, body, blocklist)
  try {
    const { ai, textModel } = await gemini()
    const res = await ai.models.generateContent({
      model: textModel,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        safetySettings: STRICT_SAFETY,
        temperature: 0,
      },
    })

    // se a própria avaliação foi bloqueada por safety, reprova por precaução
    const safety = safetyVerdict(res)
    if (safety.blocked) {
      return { approved: false, reason: `classificador bloqueado: ${safety.reason}`, scores: { safety: safety.reason } }
    }

    const parsed = parseJsonLoose(res.text ?? '')
    const v = ClassifierSchema.safeParse(parsed)
    if (!v.success) {
      // sem veredito legível → reprova por precaução (humano decide depois)
      return { approved: false, reason: 'classificador devolveu JSON inválido', scores: { raw: res.text ?? '' } }
    }

    return { approved: v.data.approved, reason: v.data.reason, scores: { ...v.data } }
  } catch (e) {
    return { approved: false, reason: `erro no classificador: ${(e as Error).message}`, scores: {} }
  }
}
