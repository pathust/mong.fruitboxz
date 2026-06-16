import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  getPromotionMetadata,
  PromotionMetadata,
  updatePromotionMetadata,
} from "../../../../../lib/promotion-metadata"

type UpdatePromotionMetadataBody = {
  metadata?: Record<string, unknown>
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const siteService = req.scope.resolve("site")
  const metadata = await getPromotionMetadata(siteService, id)
  let usageCount = 0

  try {
    const query = req.scope.resolve("query")
    const { data: promotions } = await query.graph({
      entity: "promotion",
      fields: ["id", "code"],
      filters: { id },
    })
    const promotionCode = (promotions as Array<{ code?: string }>)[0]?.code

    if (promotionCode) {
      const { data: orders } = await query.graph({
        entity: "order",
        fields: ["id", "metadata"],
      })
      usageCount = (orders as Array<{ metadata?: Record<string, unknown> | null }>)
        .filter((order) => order.metadata?.promotion_code === promotionCode)
        .length
    }
  } catch (err: unknown) {
    console.error("Error counting promotion usage", err)
  }

  res.json({ metadata: { ...metadata, usage_count: usageCount } })
}

export async function POST(req: MedusaRequest<UpdatePromotionMetadataBody>, res: MedusaResponse) {
  const { id } = req.params
  const metadata = (req.body.metadata || {}) as PromotionMetadata
  const siteService = req.scope.resolve("site")

  try {
    const updated = await updatePromotionMetadata(siteService, id, metadata)
    res.json({ success: true, metadata: updated })
  } catch (err: unknown) {
    console.error("Error updating promotion metadata", err)
    const error = err instanceof Error ? err.message : "Unknown error"
    res.status(500).json({ message: "Failed to update metadata", error })
  }
}
