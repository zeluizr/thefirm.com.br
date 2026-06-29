import { applyLudicImageStyle } from '../lib/constants'
import { firstInlineData, gemini, safetyVerdict, STRICT_SAFETY } from '../lib/gemini'
import { saveBase64 } from '../lib/storage'

export type ImageResult =
  | { ok: true; url: string }
  | { ok: false; reason: string; blocked: boolean }

// imagem lúdica via Nano Banana (generateContent → bytes em inlineData). addendum §E
export async function generateImage(
  imagePrompt: string,
  basename: string,
): Promise<ImageResult> {
  try {
    const { ai, imageModel } = await gemini()
    const res = await ai.models.generateContent({
      model: imageModel,
      contents: applyLudicImageStyle(imagePrompt),
      config: { safetySettings: STRICT_SAFETY },
    })

    const verdict = safetyVerdict(res)
    if (verdict.blocked) {
      return { ok: false, reason: verdict.reason, blocked: true }
    }

    const inline = firstInlineData(res)
    if (!inline) {
      return { ok: false, reason: 'resposta sem bytes de imagem', blocked: false }
    }

    const url = await saveBase64(inline.data, inline.mimeType, basename)
    return { ok: true, url }
  } catch (e) {
    return { ok: false, reason: `erro na imagem: ${(e as Error).message}`, blocked: false }
  }
}
