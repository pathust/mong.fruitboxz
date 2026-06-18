import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { CACHE_KEYS, TTL, cached, resolveCache } from "../../../../../lib/cache"

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

  res.json({ product })
}
