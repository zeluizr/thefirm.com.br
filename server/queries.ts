import { db } from './lib/db'

// somente posts PUBLISHED são expostos publicamente (CLAUDE.md §8)
export async function listPublishedPosts(categorySlug?: string) {
  return db.post.findMany({
    where: {
      status: 'PUBLISHED',
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    },
    orderBy: { publishedAt: 'desc' },
    include: { category: true },
    take: 100,
  })
}

export async function getPublishedPostBySlug(slug: string) {
  return db.post.findFirst({
    where: { slug, status: 'PUBLISHED' },
    include: { category: true },
  })
}

// categorias que têm ao menos 1 post publicado (pros chips de filtro)
export async function listCategoriesWithPosts() {
  return db.category.findMany({
    where: { posts: { some: { status: 'PUBLISHED' } } },
    orderBy: { name: 'asc' },
    select: { id: true, slug: true, name: true },
  })
}
