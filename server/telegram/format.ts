// teclados inline e caption — únicos comandos válidos vêm de callback_data
// (CLAUDE.md §6: nada do corpo do post é interpretado como ação).

export type InlineKeyboard = {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
}

export function mainKeyboard(postId: string): InlineKeyboard {
  return {
    inline_keyboard: [
      [
        { text: '✅ Aprovar', callback_data: `approve:${postId}` },
        { text: '🗑️ Rejeitar', callback_data: `reject:${postId}` },
      ],
      [{ text: '🔁 Trocar categoria', callback_data: `recat:${postId}` }],
    ],
  }
}

export function categoryKeyboard(
  postId: string,
  categories: Array<{ id: string; name: string }>,
): InlineKeyboard {
  const rows: InlineKeyboard['inline_keyboard'] = []
  for (let i = 0; i < categories.length; i += 2) {
    rows.push(
      categories.slice(i, i + 2).map((c) => ({
        text: c.name,
        callback_data: `setcat:${postId}:${c.id}`,
      })),
    )
  }
  rows.push([{ text: '« voltar', callback_data: `back:${postId}` }])
  return { inline_keyboard: rows }
}

export function buildCaption(
  post: { title: string; summary: string },
  categoryName: string,
): string {
  return `🗞️ ${post.title}\n\n${post.summary}\n\n📂 ${categoryName}`
}

export function withStatus(caption: string, statusLine: string): string {
  return `${statusLine}\n\n${caption}`
}
