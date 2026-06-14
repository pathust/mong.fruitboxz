import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const siteService = req.scope.resolve("site") as any
  const { id } = req.params
  const body = req.body as Record<string, unknown>

  const existing = await siteService.retrieveReview(id).catch(() => null)
  if (!existing) return res.status(404).json({ error: "Review not found" })

  const review = await siteService.updateReviews({ id, ...body })
  res.json({ review })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const siteService = req.scope.resolve("site") as any
  const { id } = req.params

  const existing = await siteService.retrieveReview(id).catch(() => null)
  if (!existing) return res.status(404).json({ error: "Review not found" })

  await siteService.deleteReviews(id)
  res.status(200).json({ id, deleted: true })
}
