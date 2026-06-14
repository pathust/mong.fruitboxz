import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    // We want products, their variants, and inventory levels
    const { data: products } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "thumbnail",
        "variants.*",
        "variants.inventory_items.*",
        "variants.inventory_items.inventory.*",
      ],
      pagination: { take: 500 }
    })

    res.json({ products })
  } catch (err: any) {
    res.status(500).json({ message: err.message, error: err })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const inventoryModule = req.scope.resolve(Modules.INVENTORY)
    const { inventory_item_id, location_id, stocked_quantity } = req.body as any

    // Simple update or creation of inventory levels
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
