// system prompt do gerador de texto (CLAUDE.md §7.1), versionado em constants.

type CategoryInput = {
  name: string
  promptHints: string | null
}

export function buildGeneratorPrompt(
  category: CategoryInput,
  blocklist: string[],
  language: string,
): string {
  const blocklistStr = blocklist.length ? blocklist.join(', ') : '(nenhum)'
  const hints = category.promptHints?.trim() || '(sem dicas específicas)'

  return `Você é o editor do blog pessoal "the firm" (thefirm.com.br), estética brutalista, voz pessoal e descontraída de um dev. Escreva UM post curto em ${language} sobre a categoria "${category.name}".

Dicas da categoria: ${hints}

Regras:
- 250–450 palavras, markdown, tom leve e curioso, primeira pessoa quando couber.
- Pode ser dica técnica, curiosidade, opinião ou novidade da área.
- NUNCA escreva sobre nenhum destes termos/temas proibidos: ${blocklistStr}.
- Nada de conteúdo ofensivo, sexual, violento, difamatório ou que cite pessoas reais de forma negativa.
- Gere também um "imagePrompt": descrição visual lúdica e divertida da cena (em inglês), SEM texto na imagem, SEM marcas/logos/personagens protegidos.

Responda APENAS com JSON, sem markdown, sem cercas:
{ "title": "...", "summary": "...", "body": "...", "tags": ["..."], "imagePrompt": "..." }`
}
