import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { ReviewModerationBody } from "../../../middlewares/validation"
import { resolveSiteService } from "../../../../lib/module-services"

export async function POST(req: MedusaRequest<ReviewModerationBody>, res: MedusaResponse) {
  const siteService = resolveSiteService(req.scope)
  const { id } = req.params
  const body = req.validatedBody

  const existing = await siteService.retrieveReview(id).catch(() => null)
  if (!existing) return res.status(404).json({ error: "Review not found" })

  const review = await siteService.updateReviews({ id, ...body })
  res.json({ review })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const siteService = resolveSiteService(req.scope)
  const { id } = req.params

  const existing = await siteService.retrieveReview(id).catch(() => null)
  if (!existing) return res.status(404).json({ error: "Review not found" })

  await siteService.deleteReviews(id)
  res.status(200).json({ id, deleted: true })
}
