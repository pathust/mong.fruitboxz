import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { resolveSiteService } from "../../../lib/module-services"
import type { ReviewListQuery } from "../../middlewares/validation"

export async function GET(req: MedusaRequest<unknown, ReviewListQuery>, res: MedusaResponse) {
  const siteService = resolveSiteService(req.scope)
  const { handle, approved } = req.validatedQuery

  const filters: Record<string, unknown> = {}
  if (handle) filters.handle = handle
  if (typeof approved === "string") filters.approved = approved === "true"

  const [reviews, count] = await siteService.listAndCountReviews(filters)
  const sorted = (reviews || []).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
  res.json({ reviews: sorted, count })
}
