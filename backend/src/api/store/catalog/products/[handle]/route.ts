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

  try {
    const query = req.scope.resolve("query")
    const variantIds = (product.variants || []).map((v: any) => v.id)
    if (variantIds.length > 0) {
      const { data: recipeItems } = await query.graph({
        entity: "recipe_item",
        fields: [
          "*",
          "ingredient.*",
          "ingredient.inventory_item.*",
          "ingredient.inventory_item.location_levels.*"
        ],
        filters: { variant_id: variantIds }
      })
      const itemsMap = new Map()
      for (const item of (recipeItems || [])) {
        if (!itemsMap.has(item.variant_id)) itemsMap.set(item.variant_id, [])
        itemsMap.get(item.variant_id).push(item)
      }
      for (const variant of product.variants || []) {
        const reqItems = itemsMap.get(variant.id) || []
        let hasStock = true
        let minCountX = Infinity
        
        for (const reqItem of reqItems) {
          const invItem = reqItem.ingredient?.inventory_item
          const stock = invItem?.location_levels?.reduce((sum: number, l: any) => sum + (l.stocked_quantity || 0), 0) || 0
          
          if (stock < reqItem.quantity) {
            hasStock = false
          }
          if (reqItem.quantity > 0) {
            const countX = Math.floor(stock / reqItem.quantity)
            if (countX < minCountX) minCountX = countX
          }
        }
        
        if (reqItems.length > 0) {
          variant.in_stock = hasStock
          const actualCount = minCountX === Infinity ? 0 : minCountX
          variant.purchasable_quantity = Math.min(actualCount, Math.max(5, Math.floor(actualCount * 0.8)))
        } else {
          variant.purchasable_quantity = variant.inventory_quantity ?? 0
        }
      }
    }
  } catch (err) {
    console.error("Failed to enrich ingredient stock", err)
  }

  res.json({ product })
}
