import {
  GoogleGenAI,
  HarmBlockThreshold,
  HarmCategory,
  type GenerateContentResponse,
  type SafetySetting,
} from '@google/genai'

import { runtimeConfig } from './config'

// client + model IDs resolvidos do config (banco > env). cacheia o client por chave.
let _ai: { key: string; client: GoogleGenAI } | undefined

export type GeminiHandle = {
  ai: GoogleGenAI
  textModel: string
  imageModel: string
  videoModel: string
}

export async function gemini(): Promise<GeminiHandle> {
  const cfg = await runtimeConfig()
  if (!cfg.geminiApiKey) {
    throw new Error('GEMINI_API_KEY não configurada — defina em /admin/settings')
  }
  if (!_ai || _ai.key !== cfg.geminiApiKey) {
    _ai = { key: cfg.geminiApiKey, client: new GoogleGenAI({ apiKey: cfg.geminiApiKey }) }
  }
  return {
    ai: _ai.client,
    textModel: cfg.geminiTextModel,
    imageModel: cfg.geminiImageModel,
    videoModel: cfg.geminiVideoModel,
  }
}

// Gate 1 de moderação: safety settings aplicados em TODA chamada generativa.
export const STRICT_SAFETY: SafetySetting[] = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
]

export type SafetyVerdict = { blocked: boolean; reason: string }

// detecta bloqueio de safety numa resposta de generateContent
export function safetyVerdict(res: GenerateContentResponse): SafetyVerdict {
  const blockReason = res.promptFeedback?.blockReason
  if (blockReason) {
    return { blocked: true, reason: `prompt bloqueado: ${blockReason}` }
  }
  const candidate = res.candidates?.[0]
  const finish = candidate?.finishReason as string | undefined
  if (finish === 'SAFETY' || finish === 'PROHIBITED_CONTENT' || finish === 'BLOCKLIST') {
    return { blocked: true, reason: `geração interrompida: ${finish}` }
  }
  return { blocked: false, reason: '' }
}

// ratings de safety estruturados (pra gravar em ModerationLog.scores)
export function safetyScores(res: GenerateContentResponse): Record<string, unknown> {
  return {
    blockReason: res.promptFeedback?.blockReason ?? null,
    finishReason: res.candidates?.[0]?.finishReason ?? null,
    safetyRatings: res.candidates?.[0]?.safetyRatings ?? [],
    promptSafetyRatings: res.promptFeedback?.safetyRatings ?? [],
  }
}

// extrai os bytes (base64) da primeira parte inlineData de imagem/mídia
export function firstInlineData(
  res: GenerateContentResponse,
): { data: string; mimeType: string } | null {
  const parts = res.candidates?.[0]?.content?.parts ?? []
  for (const p of parts) {
    if (p.inlineData?.data) {
      return {
        data: p.inlineData.data,
        mimeType: p.inlineData.mimeType ?? 'image/png',
      }
    }
  }
  return null
}
