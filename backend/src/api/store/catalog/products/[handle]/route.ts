import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { CACHE_KEYS, TTL, cached, resolveCache } from "../../../../../lib/cache"
import { enrichWithIngredientStock } from "../../../../../lib/inventory"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const handle = req.params.handle
  const cache = resolveCache(req.scope)
  const product = await cached(cache, CACHE_KEYS.product(handle), TTL.product, async () => {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "product",
      fields: [
        "id", "handle", "title", "description", "thumbnail", "metadata",
        "created_at", "updated_at", "images.url", "categories.id",
        "categories.name", "categories.handle", "variants.id", "variants.title",
        "variants.manage_inventory", "variants.allow_backorder",
        "variants.inventory_quantity", "variants.prices.amount",
        "variants.prices.currency_code",
      ],
      filters: { handle },
      pagination: { take: 1 },
    })
    return data?.[0] || null
  })

  if (!product) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Product not found")
  }

  // Stock changes far more often than the product data above, so it's kept
  // on its own short-lived cache entry rather than folded into the 30-minute
  // product cache — bounds repeated ingredient/inventory lookups on a
  // popular product page without letting the stock badge go stale for long.
  const stockCacheKey = `${CACHE_KEYS.product(handle)}:stock`
  const variants = await cached(cache, stockCacheKey, 30, async () => {
    const [enriched] = await enrichWithIngredientStock([{ variants: product.variants }], req.scope)
    return enriched.variants
  })
  product.variants = variants

  res.json({ product })
}
