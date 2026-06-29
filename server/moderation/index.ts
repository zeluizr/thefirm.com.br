import type { Prisma } from '@prisma/client'

import { CLASSIFIER_VERSION } from '../lib/constants'
import { db } from '../lib/db'
import { classify } from './classifier'

// gate 1: registra o veredito de safety da geração (provider gemini-safety)
export async function logSafetyGate(
  postId: string,
  scores: Record<string, unknown>,
  passed: boolean,
): Promise<void> {
  await db.moderationLog.create({
    data: { postId, provider: 'gemini-safety', scores: scores as Prisma.InputJsonValue, passed },
  })
}

export type GateResult = { passed: boolean; reason: string }

// gate 2: roda o classificador e registra (provider gemini-classifier)
export async function runClassifierGate(
  postId: string,
  title: string,
  body: string,
  blocklist: string[],
): Promise<GateResult> {
  const result = await classify(title, body, blocklist)
  await db.moderationLog.create({
    data: {
      postId,
      provider: 'gemini-classifier',
      scores: { version: CLASSIFIER_VERSION, ...result.scores } as Prisma.InputJsonValue,
      passed: result.approved,
    },
  })
  return { passed: result.approved, reason: result.reason }
}
