import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    // Fetch all inventory items and their location levels
    const { data: inventory_items } = await query.graph({
      entity: "inventory_item",
      fields: [
        "id",
        "title",
        "sku",
        "metadata",
        "location_levels.*",
      ],
      pagination: { take: 500 }
    })

    // Filter to only include items marked as ingredients
    const ingredients = inventory_items.filter((item: any) => item.metadata?.is_ingredient === true)

    res.json({ ingredients })
  } catch (err: any) {
    res.status(500).json({ message: err.message, error: err })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const inventoryModule = req.scope.resolve(Modules.INVENTORY)
    const { inventory_item_id, location_id, stocked_quantity } = req.body as any

    if (inventory_item_id && location_id) {
      await inventoryModule.updateInventoryLevels([
        {
          inventory_item_id,
          location_id,
          stocked_quantity: Number(stocked_quantity)
        }
      ])
    }

    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ message: err.message, error: err })
  }
}
