// parsing tolerante do JSON do LLM: tira cercas ```json, lixo antes/depois,
// e tenta o maior bloco { ... } se o parse direto falhar. Nunca lança —
// devolve null em falha pra quem chama tratar (CLAUDE.md §12).
export function parseJsonLoose<T = unknown>(text: string): T | null {
  if (!text) return null
  let s = text.trim()

  // remove cercas de markdown
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) s = fence[1].trim()

  try {
    return JSON.parse(s) as T
  } catch {
    // tenta isolar do primeiro { ao último }
    const first = s.indexOf('{')
    const last = s.lastIndexOf('}')
    if (first !== -1 && last > first) {
      try {
        return JSON.parse(s.slice(first, last + 1)) as T
      } catch {
        return null
      }
    }
    return null
  }
}
