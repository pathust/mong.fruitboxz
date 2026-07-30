import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { InventoryLevelBody } from "../../../middlewares/validation"
import { sendInternalError } from "../../../../lib/api-error"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    // Fetch product variants and their inventory items
    const { data: variantsData } = await query.graph({
      entity: "product_variant",
      fields: [
        "title",
        "sku",
        "product.title",
        "inventory_items.inventory_item_id",
        "inventory_items.inventory.id",
        "inventory_items.inventory.sku",
        "inventory_items.inventory.location_levels.*"
      ],
      pagination: { take: 500 }
    })

    const stockLocationModule = req.scope.resolve(Modules.STOCK_LOCATION)
    const stockLocations = await stockLocationModule.listStockLocations({}, { take: 1 })
    const defaultLocationId = stockLocations[0]?.id

    const ingredients = variantsData.map((v: any) => {
      const invItems = v.inventory_items || []
      const invItemInfo = invItems[0]
      const invItem = invItemInfo?.inventory
      const locationLevels = invItem?.location_levels || []
      
      if (locationLevels.length === 0 && defaultLocationId && invItem) {
        locationLevels.push({
          location_id: defaultLocationId,
          stocked_quantity: 0
        })
      }

      return {
        id: invItem?.id, // Use inventory_item id for updates
        title: `${v.product?.title || ''} - ${v.title || ''}`.trim(),
        sku: invItem?.sku || v.sku || '',
        metadata: {
          unit: 'cái',
          category: "Sản phẩm"
        },
        location_levels: locationLevels
      }
    }).filter((ing: any) => ing.id) 

    res.json({ ingredients })
  } catch (error: unknown) {
    sendInternalError(req, res, error, "Unable to fetch inventory", "INVENTORY_LIST_FAILED")
  }
}

export async function POST(req: MedusaRequest<InventoryLevelBody>, res: MedusaResponse) {
  try {
    const inventoryModule = req.scope.resolve(Modules.INVENTORY)
    const { inventory_item_id, location_id, stocked_quantity } = req.validatedBody

    if (inventory_item_id && location_id) {
      const quantity = Number(stocked_quantity)
      
      try {
        await inventoryModule.updateInventoryLevels([
          {
            inventory_item_id,
            location_id,
            stocked_quantity: quantity
          }
        ])
      } catch (error: unknown) {
        const err = error as { message?: string, type?: string };
        // If it fails (e.g. level doesn't exist), create it
        if (err.message?.includes("not found") || err.type === "not_found") {
          await inventoryModule.createInventoryLevels([
            {
              inventory_item_id,
              location_id,
              stocked_quantity: quantity
            }
          ])
        } else {
          throw error
        }
      }
    }

    res.json({ success: true })
  } catch (error: unknown) {
    sendInternalError(req, res, error, "Unable to update inventory", "INVENTORY_UPDATE_FAILED")
  }
}
