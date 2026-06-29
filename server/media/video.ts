import { writeFile } from 'node:fs/promises'

import {
  applyLudicVideoStyle,
  VIDEO_POLL_INTERVAL_MS,
  VIDEO_POLL_TIMEOUT_MS,
} from '../lib/constants'
import { gemini } from '../lib/gemini'
import { mediaTarget } from '../lib/storage'

export type VideoResult = { ok: true; url: string } | { ok: false; reason: string }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// vídeo lúdico via Veo 3.1 — operação longa, polling inline com teto (addendum §F)
export async function generateVideo(
  imagePrompt: string,
  basename: string,
): Promise<VideoResult> {
  try {
    const { ai, videoModel } = await gemini()

    // Veo aplica safety server-side; o SDK não expõe safetySettings nesta config.
    // Um retorno "sem vídeo" no polling é tratado como bloqueio/safety abaixo.
    let op = await ai.models.generateVideos({
      model: videoModel,
      prompt: applyLudicVideoStyle(imagePrompt),
    })

    const deadline = Date.now() + VIDEO_POLL_TIMEOUT_MS
    while (!op.done && Date.now() < deadline) {
      await sleep(VIDEO_POLL_INTERVAL_MS)
      op = await ai.operations.getVideosOperation({ operation: op })
    }

    if (!op.done) {
      return { ok: false, reason: 'timeout do Veo (polling excedeu o teto)' }
    }

    const generated = op.response?.generatedVideos?.[0]
    if (!generated?.video) {
      return { ok: false, reason: 'Veo terminou sem vídeo (provável bloqueio/safety)' }
    }

    const { path, url } = await mediaTarget(`${basename}.mp4`)
    const bytes = generated.video.videoBytes
    if (bytes) {
      await writeFile(path, Buffer.from(bytes, 'base64'))
    } else {
      await ai.files.download({ file: generated.video, downloadPath: path })
    }
    return { ok: true, url }
  } catch (e) {
    return { ok: false, reason: `erro no vídeo: ${(e as Error).message}` }
  }
}
