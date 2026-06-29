// parsing tolerante do JSON do LLM (CLAUDE.md §12). Nunca lança — devolve null
// em falha. Lida com: cercas ```json, lixo antes/depois, e o caso comum do LLM
// colar uma chave '}' a mais no fim (que quebra o slice ingênuo first..last).
export function parseJsonLoose<T = unknown>(text: string): T | null {
  if (!text) return null
  let s = text.trim()

  // só desembrulha cerca se a resposta INTEIRA é uma cerca — não quando ``` aparece
  // dentro do JSON (ex.: um bloco de código no body do post)
  if (s.startsWith('```')) {
    const fence = s.match(/^```(?:json)?\s*([\s\S]*?)```\s*$/i)
    if (fence) s = fence[1].trim()
  }

  try {
    return JSON.parse(s) as T
  } catch {
    // extrai o primeiro objeto { ... } balanceado e ignora qualquer lixo depois
    const obj = extractFirstJsonObject(s)
    if (obj) {
      try {
        return JSON.parse(obj) as T
      } catch {
        return null
      }
    }
    return null
  }
}

// varre a partir do primeiro '{' contando chaves, respeitando strings/escapes,
// e devolve o trecho do primeiro objeto completo (ignora '{' '}' dentro de strings).
function extractFirstJsonObject(s: string): string | null {
  const start = s.indexOf('{')
  if (start === -1) return null

  let depth = 0
  let inString = false
  let escaped = false

  for (let i = start; i < s.length; i++) {
    const c = s[i]
    if (escaped) {
      escaped = false
      continue
    }
    if (c === '\\') {
      if (inString) escaped = true
      continue
    }
    if (c === '"') {
      inString = !inString
      continue
    }
    if (inString) continue
    if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0) return s.slice(start, i + 1)
    }
  }
  return null
}
