import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { INGREDIENTS_MODULE } from "../../../../modules/ingredients"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  
  try {
    const { data } = await query.graph({
      entity: "ingredient",
      fields: [
        "*",
        "recipe_items.*",
        "inventory_item.*",
        "inventory_item.location_levels.*"
      ],
      filters: { id }
    })
    
    if (!data.length) {
      return res.status(404).json({ message: "Ingredient not found" })
    }

    const ing = data[0] as any
    const invItem = ing.inventory_item
    const stockedQuantity = invItem?.location_levels?.reduce((sum: number, l: any) => sum + (l.stocked_quantity || 0), 0) || 0

    res.json({ 
      ingredient: {
        ...ing,
        stock_quantity: stockedQuantity,
        inventory_item_id: invItem?.id
      } 
    })
  } catch (err: any) {
    res.status(404).json({ message: "Ingredient not found" })
  }
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const ingredientsService = req.scope.resolve(INGREDIENTS_MODULE)
  const inventoryService = req.scope.resolve(Modules.INVENTORY)
  const stockLocationService = req.scope.resolve(Modules.STOCK_LOCATION)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  
  const data = req.body as any
  const ingredientData = { ...data }
  delete ingredientData.stock_quantity // Just in case it's passed
  
  const ingredient = await ingredientsService.updateIngredients({
    id,
    ...ingredientData
  })

  // Sync inventory title if ingredient name changed
  if (ingredientData.name) {
    const { data: qData } = await query.graph({
      entity: "ingredient",
      fields: ["*", "inventory_item.*"],
      filters: { id }
    })
    const invItem = qData[0]?.inventory_item as any
    
    if (invItem) {
      await inventoryService.updateInventoryItems({
        id: invItem.id,
        title: ingredientData.name
      })
    }
  }
  
  res.json({ ingredient })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const ingredientsService = req.scope.resolve(INGREDIENTS_MODULE)
  const inventoryService = req.scope.resolve(Modules.INVENTORY)
  const linkService = req.scope.resolve(ContainerRegistrationKeys.LINK)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  
  const { data: qData } = await query.graph({
    entity: "ingredient",
    fields: ["inventory_item.*", "recipe_items.*"],
    filters: { id }
  })
  const invItem = qData[0]?.inventory_item as any
  const recipeItems = qData[0]?.recipe_items || []
  
  console.log(`Starting DELETE for ingredient ${id}`)
  
  if (invItem) {
    console.log(`Found invItem ${invItem.id}, dismissing link...`)
    try {
      await linkService.dismiss({
        [INGREDIENTS_MODULE]: { ingredient_id: id },
        [Modules.INVENTORY]: { inventory_item_id: invItem.id }
      })
      console.log(`Dismissed link successfully`)
    } catch (e: any) {
      console.error(`Error dismissing link:`, e.message)
    }
    
    console.log(`Deleting inventory item ${invItem.id}...`)
    try {
      await inventoryService.deleteInventoryItems(invItem.id)
      console.log(`Deleted inventory item successfully`)
    } catch (e: any) {
      console.error(`Error deleting inv item:`, e.message)
    }
  }
  
  if (recipeItems.length > 0) {
    console.log(`Deleting ${recipeItems.length} recipe items for ingredient ${id}`)
    try {
      const recipeItemIds = recipeItems.map((r: any) => r.id)
      // Wait, there might not be a direct method like deleteRecipeItems if we don't have the module service method generated or exposed directly, 
      // but in Medusa V2 we can use ingredientsService.deleteRecipeItems.
      await ingredientsService.deleteRecipeItems(recipeItemIds)
      console.log(`Deleted recipe items successfully`)
    } catch (e: any) {
      console.error(`Error deleting recipe items:`, e.message)
    }
  }

  console.log(`Deleting ingredient ${id}...`)
  try {
    await ingredientsService.deleteIngredients(id)
    console.log(`Deleted ingredient successfully`)
  } catch (e: any) {
    console.error(`Error deleting ingredient:`, e.message)
    return res.status(400).json({ message: "Lỗi hệ thống: " + e.message })
  }
  
  res.json({ id, object: "ingredient", deleted: true })
}
