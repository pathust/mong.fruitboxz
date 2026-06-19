import { AuthenticatedMedusaRequest, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import type { ReviewBody } from "../../../middlewares/validation"
import { resolveSiteService } from "../../../../lib/module-services"

type PurchasedOrder = {
  items?: Array<{
    title?: string | null
    metadata?: Record<string, unknown> | null
  }>
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const handle = (req.params.handle || "").toString()
  const query = req.scope.resolve("query")
  const { data: reviews } = await query.graph({
    entity: "site_review",
    filters: { handle, approved: true },
    fields: [
      "id", "rating", "comment", "created_at",
      "customer.first_name", "customer.last_name", "customer.email",
    ],
  })

  const count = reviews.length
  const average = count ? reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / count : 0

  res.json({ reviews, summary: { count, average: Number(average.toFixed(1)) } })
}

export async function POST(req: AuthenticatedMedusaRequest<ReviewBody>, res: MedusaResponse) {
  const siteService = resolveSiteService(req.scope)
  const handle = (req.params.handle || "").toString()
  const customerId = req.auth_context.actor_id

  const { rating, comment, product_id, product_title } = req.validatedBody

  const orderModuleService = req.scope.resolve(Modules.ORDER)
  const orders = await orderModuleService.listOrders(
    { customer_id: customerId },
    { relations: ["items"], take: 100 }
  )

  const hasPurchased = (orders as PurchasedOrder[]).some((order) =>
    (order.items || []).some((item) =>
      item?.metadata?.frontend_item_id === product_id ||
      item?.title === product_title
    )
  )

  if (!hasPurchased) {
    return res.status(403).json({ message: "Ban chi co the danh gia san pham da mua" })
  }

  const review = await siteService.createReviews({
    handle,
    product_id,
    customer_id: customerId,
    rating: Number(rating),
    comment: (comment || "").toString().trim(),
    approved: true,
  })

  res.status(201).json({ review })
}
