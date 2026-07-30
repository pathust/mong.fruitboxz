import type { ServiceScope } from "./module-services"

export async function enrichWithIngredientStock(hits: any[], scope: ServiceScope) {
  try {
    const query = scope.resolve("query") as any
    const variantIds: string[] = []
    
    for (const hit of hits) {
      if (hit.variants) {
        variantIds.push(...hit.variants.map((v: any) => v.id))
      }
    }
    
    if (variantIds.length === 0) return hits

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
    
    for (const hit of hits) {
      if (hit.variants) {
        for (const variant of hit.variants) {
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
            // For simple products without recipes, fall back to basic inventory
            variant.purchasable_quantity = variant.inventory_quantity ?? 0
          }
        }
        hit.inStock = hit.variants.some((v: any) => v.in_stock !== false)
        hit.in_stock = hit.inStock
      }
    }
  } catch (err) {
    console.error("Failed to enrich ingredient stock", err)
  }
  return hits
}
