import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

function getCustomerId(req: MedusaRequest): string | undefined {
  const authHeader = req.headers.authorization || req.headers["authorization"] || ""
  if (authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.slice(7)
      const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString())
      if (payload.actor_type === "customer") {
        return payload.actor_id
      }
    } catch {}
  }
  return undefined
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const siteService = req.scope.resolve("site") as any
  const handle = (req.params.handle || "").toString()
  const [reviews] = await siteService.listAndCountReviews({ handle, approved: true })

  const count = reviews.length
  const average = count ? reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / count : 0

  res.json({ reviews, summary: { count, average: Number(average.toFixed(1)) } })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const siteService = req.scope.resolve("site") as any
  const handle = (req.params.handle || "").toString()
  const customerId = getCustomerId(req)
  if (!customerId) return res.status(401).json({ message: "Unauthorized" })

  const { rating, comment, product_id, product_title } = (req.body || {}) as any
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5" })
  }

  const orderModuleService = req.scope.resolve(Modules.ORDER)
  const orders = await orderModuleService.listOrders(
    { customer_id: customerId },
    { relations: ["items"], take: 100 }
  )

  const hasPurchased = orders.some((order: any) =>
    (order.items || []).some((item: any) =>
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
