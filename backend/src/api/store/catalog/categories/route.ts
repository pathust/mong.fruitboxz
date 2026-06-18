import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { CACHE_KEYS, TTL, cached, resolveCache } from "../../../../lib/cache"

type CategoryRecord = {
  id: string
  name: string
  handle?: string | null
  description?: string | null
  metadata?: Record<string, unknown> | null
}

type ProductImageRecord = {
  thumbnail?: string | null
  images?: Array<{ url?: string | null }>
  categories?: Array<{ id: string }>
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cache = resolveCache(req.scope)
  const categories = await cached(cache, CACHE_KEYS.categories, TTL.categories, async () => {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const [categoryResult, productResult] = await Promise.all([
      query.graph({
        entity: "product_category",
        fields: ["id", "name", "handle", "description", "metadata"],
        pagination: { take: 100 },
      }),
      query.graph({
        entity: "product",
        fields: ["id", "thumbnail", "images.url", "categories.id"],
        filters: { status: "published" },
        pagination: { take: 1000 },
      }),
    ])

    const products = (productResult.data || []) as ProductImageRecord[]
    const imageByCategory = new Map<string, string>()
    for (const product of products) {
      const image = product.thumbnail || product.images?.[0]?.url || ""
      if (!image) continue
      for (const category of product.categories || []) {
        if (!imageByCategory.has(category.id)) imageByCategory.set(category.id, image)
      }
    }

    return ((categoryResult.data || []) as CategoryRecord[]).map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.handle || category.id,
      description: category.description || "",
      image:
        (typeof category.metadata?.image === "string" ? category.metadata.image : "") ||
        imageByCategory.get(category.id) ||
        "",
    }))
  })

  res.json({ categories })
}
