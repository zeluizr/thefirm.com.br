// versões dos prompts (auditoria — gravadas em GenerationLog/Post)
export const GENERATOR_VERSION = 'v1'
export const CLASSIFIER_VERSION = 'v1'

// teto de polling do vídeo Veo (addendum §F)
export const VIDEO_POLL_TIMEOUT_MS = 5 * 60_000
export const VIDEO_POLL_INTERVAL_MS = 10_000

// estilo lúdico fixo de imagem (CLAUDE.md §7.3)
export function applyLudicImageStyle(imagePrompt: string): string {
  return `${imagePrompt}, playful flat editorial illustration, vibrant saturated colors, bold shapes, whimsical and friendly, soft shadows, clean vector look, no text, no logos, no real people, no copyrighted characters`
}

// estilo lúdico fixo de vídeo (CLAUDE.md §7.4)
export function applyLudicVideoStyle(imagePrompt: string): string {
  return `${imagePrompt}, playful animated illustration style, vibrant colors, smooth bouncy motion, whimsical, 5 seconds, no text, no logos, no real people`
}
