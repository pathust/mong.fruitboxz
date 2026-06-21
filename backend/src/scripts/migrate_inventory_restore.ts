import { MedusaContainer } from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { INGREDIENTS_MODULE } from "../modules/ingredients"
import fs from "fs"

export default async function myScript({
  container,
}: {
  container: MedusaContainer
}) {
  const inventoryService = container.resolve(Modules.INVENTORY)
  const stockLocationService = container.resolve(Modules.STOCK_LOCATION)
  const linkService = container.resolve(ContainerRegistrationKeys.LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  
  const backupData = JSON.parse(fs.readFileSync('ingredients_backup.json', 'utf8'))
  console.log(`Loaded ${backupData.length} ingredients from backup.`)
  
  const locations = await stockLocationService.listStockLocations({})
  let locId = locations[0]?.id
  if (!locId) {
    const newLoc = await stockLocationService.createStockLocations({ name: "Default" })
    locId = newLoc.id
  }
  
  for (const ingredient of backupData) {
    try {
      console.log(`Processing ingredient ${ingredient.name} (${ingredient.id})...`)
      
      const { data } = await query.graph({
        entity: "ingredient",
        fields: ["*", "inventory_item.*"],
        filters: { id: ingredient.id }
      })
      
      const existingIng = data[0]
      if (!existingIng) {
        console.log(`Ingredient ${ingredient.id} not found in DB, skipping.`)
        continue
      }
      
      if (existingIng.inventory_items?.length > 0) {
        console.log(`Ingredient ${ingredient.id} already has inventory item, skipping.`)
        continue
      }
      
      const inventoryItem = await inventoryService.createInventoryItems({
        sku: ingredient.sku || `ing_${ingredient.id}`,
        title: ingredient.name,
        requires_shipping: false
      })
      
      await linkService.create({
        [INGREDIENTS_MODULE]: { ingredient_id: ingredient.id },
        [Modules.INVENTORY]: { inventory_item_id: inventoryItem.id }
      })
      
      await inventoryService.createInventoryLevels({
        inventory_item_id: inventoryItem.id,
        location_id: locId,
        stocked_quantity: ingredient.stock_quantity ?? 0,
      })
      
      console.log(`Successfully restored inventory for ${ingredient.name}`)
    } catch (err) {
      console.error(`Failed to process ${ingredient.name}`, err)
    }
  }
}
