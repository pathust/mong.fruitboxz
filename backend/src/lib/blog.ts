function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function normalizeBlogPostPayload(body: Record<string, any>) {
  const title = String(body.title || "").trim()
  const slug = String(body.slug || slugify(title)).trim()

  return {
    title,
    slug,
    excerpt: body.excerpt || "",
    content: body.content || "",
    image: body.image || "",
    author: body.author || "Mọng Fruitbox",
    category: body.category || "",
    published: body.published ?? true,
    published_at: body.published_at || (body.published === false ? null : new Date()),
  }
}

