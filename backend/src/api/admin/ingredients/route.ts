import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { INGREDIENTS_MODULE } from "../../../modules/ingredients"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  
  const { data } = await query.graph({
    entity: "ingredient",
    fields: [
      "*",
      "inventory_item.*",
      "inventory_item.location_levels.*"
    ],
  })
  
  // Map it so it mimics the old structure for the admin frontend
  const ingredients = data.map((ing: any) => {
    const invItem = ing.inventory_item
    const stockedQuantity = invItem?.location_levels?.reduce((sum: number, l: any) => sum + (l.stocked_quantity || 0), 0) || 0
    return {
      ...ing,
      stock_quantity: stockedQuantity,
      inventory_item_id: invItem?.id
    }
  })

  // Sort by created_at DESC manually
  ingredients.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  res.json({ ingredients })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const ingredientsService = req.scope.resolve(INGREDIENTS_MODULE)
  const inventoryService = req.scope.resolve(Modules.INVENTORY)
  const linkService = req.scope.resolve(ContainerRegistrationKeys.LINK)
  
  const { name, sku, unit, cost_price, type } = req.body as any
  
  const ingredient = await ingredientsService.createIngredients({
    name,
    sku,
    unit: unit ?? "piece",
    cost_price,
    type: type ?? "other"
  })
  
  const inventoryItem = await inventoryService.createInventoryItems({
    sku: sku || `ing_${ingredient.id}`,
    title: name,
    requires_shipping: false
  })
  
  await linkService.create({
    [INGREDIENTS_MODULE]: { ingredient_id: ingredient.id },
    [Modules.INVENTORY]: { inventory_item_id: inventoryItem.id }
  })
  
  res.status(201).json({ ingredient })
}
