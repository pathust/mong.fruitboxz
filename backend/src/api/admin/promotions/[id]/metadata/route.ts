import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  getPromotionMetadata,
  countPromotionUsage,
  PromotionMetadata,
  updatePromotionMetadata,
} from "../../../../../lib/promotion-metadata"
import type { PromotionMetadataBody } from "../../../../middlewares/validation"
import { resolveSiteService } from "../../../../../lib/module-services"
import { sendInternalError } from "../../../../../lib/api-error"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const siteService = resolveSiteService(req.scope)
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
      usageCount = await countPromotionUsage(req.scope, promotionCode)
    }
  } catch (err: unknown) {
    // Best-effort: usage_count is a supplementary figure, not worth
    // failing the whole metadata fetch over — log and fall back to 0.
    const logger = req.scope.resolve<{ error(message: string, error?: unknown): void }>("logger")
    logger.error("Error counting promotion usage", err)
  }

  res.json({ metadata: { ...metadata, usage_count: usageCount } })
}

export async function POST(req: MedusaRequest<PromotionMetadataBody>, res: MedusaResponse) {
  const { id } = req.params
  const metadata = req.validatedBody.metadata as PromotionMetadata
  const siteService = resolveSiteService(req.scope)

  try {
    const updated = await updatePromotionMetadata(siteService, id, metadata)
    res.json({ success: true, metadata: updated })
  } catch (err: unknown) {
    sendInternalError(req, res, err, "Unable to update promotion metadata", "PROMOTION_METADATA_UPDATE_FAILED")
  }
}
