import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { InventoryLevelBody } from "../../../middlewares/validation"
import { sendInternalError } from "../../../../lib/api-error"

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
    const ingredients = (inventory_items as Array<{ metadata?: Record<string, unknown> | null }>).filter(
      (item) => item.metadata?.is_ingredient === true
    )

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
      await inventoryModule.updateInventoryLevels([
        {
          inventory_item_id,
          location_id,
          stocked_quantity: Number(stocked_quantity)
        }
      ])
    }

    res.json({ success: true })
  } catch (error: unknown) {
    sendInternalError(req, res, error, "Unable to update inventory", "INVENTORY_UPDATE_FAILED")
  }
}
