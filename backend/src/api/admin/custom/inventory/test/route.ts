import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product_variant",
    fields: [
      "title",
      "sku",
      "inventory_items.inventory_item_id",
      "inventory_items.inventory.id",
      "inventory_items.inventory.sku",
      "inventory_items.inventory.location_levels.*"
    ],
    pagination: { take: 5 }
  })
  res.json({ data })
}
