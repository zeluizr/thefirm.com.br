// system prompt do classificador de moderação (CLAUDE.md §7.2)

export function buildClassifierPrompt(
  title: string,
  body: string,
  blocklist: string[],
): string {
  const blocklistStr = blocklist.length ? blocklist.join(', ') : '(nenhum)'
  return `Você é um moderador. Avalie se o post abaixo é seguro para publicação pública num blog de tecnologia e cultura. Reprove se houver: ódio, assédio, conteúdo sexual, violência gráfica, automutilação, desinformação perigosa, difamação de pessoa real, ou qualquer tema da blocklist: ${blocklistStr}.

Responda APENAS com JSON: { "approved": true|false, "reason": "..." }

Post:
${title}
${body}`
}
