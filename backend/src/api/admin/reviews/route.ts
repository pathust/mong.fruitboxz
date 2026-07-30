import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { resolveSiteService } from "../../../lib/module-services"
import type { ReviewListQuery } from "../../middlewares/validation"

export async function GET(req: MedusaRequest<unknown, ReviewListQuery>, res: MedusaResponse) {
  const siteService = resolveSiteService(req.scope)
  const { handle, approved } = req.validatedQuery

  const filters: Record<string, unknown> = {}
  if (handle) filters.handle = handle
  if (typeof approved === "boolean") filters.approved = approved

  const [reviews, count] = await siteService.listAndCountReviews(filters, {
    order: { created_at: "DESC" },
  })
  res.json({ reviews, count })
}
