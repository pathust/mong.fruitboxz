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

  res.json({ metadata })
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
