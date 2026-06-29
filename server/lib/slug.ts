export function slugify(input: string): string {
  const base = input
    .normalize('NFKD')
    .replace(/[^\x00-\x7f]/g, '') // remove acentos/diacríticos e não-ASCII
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '')
  return base || 'post'
}

export function uniqueSlug(title: string): string {
  const suffix = crypto.randomUUID().slice(0, 6)
  return `${slugify(title)}-${suffix}`
}
