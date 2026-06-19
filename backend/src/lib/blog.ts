export type BlogPostPayload = {
  title?: string
  slug?: string
  excerpt?: string | null
  content?: string | null
  image?: string | null
  author?: string | null
  category_id?: string | null
  published?: boolean
  published_at?: string | Date | null
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function normalizeBlogPostPayload(body: BlogPostPayload) {
  const title = String(body.title || "").trim()
  const slug = String(body.slug || slugify(title)).trim()

  return {
    title,
    slug,
    excerpt: body.excerpt || "",
    content: body.content || "",
    image: body.image || "",
    author: body.author || "Mọng Fruitbox",
    category_id: body.category_id || null,
    published: body.published ?? true,
    published_at: body.published_at || (body.published === false ? null : new Date()),
  }
}
