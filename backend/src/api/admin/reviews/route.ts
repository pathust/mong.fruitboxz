import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const siteService = req.scope.resolve("site") as any
  const { handle, approved } = req.query as { handle?: string; approved?: string }

  const filters: Record<string, unknown> = {}
  if (handle) filters.handle = handle
  if (typeof approved === "string") filters.approved = approved === "true"

  const [reviews, count] = await siteService.listAndCountReviews(filters)
  const sorted = (reviews || []).sort(
    (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
  res.json({ reviews: sorted, count })
}
