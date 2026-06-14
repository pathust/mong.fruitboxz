import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const siteService = req.scope.resolve("site") as any
  const banner = await siteService.retrieveBanner(req.params.id).catch(() => null)
  if (!banner) return res.status(404).json({ error: "Banner not found" })
  res.json({ banner })
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const siteService = req.scope.resolve("site") as any
  const existing = await siteService.retrieveBanner(req.params.id).catch(() => null)
  if (!existing) return res.status(404).json({ error: "Banner not found" })
  const body = req.body as any
  const banner = await siteService.updateBanners({
    id: req.params.id,
    ...body,
    updated_at: new Date().toISOString(),
  })
  res.json({ banner })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const siteService = req.scope.resolve("site") as any
  const existing = await siteService.retrieveBanner(req.params.id).catch(() => null)
  if (!existing) return res.status(404).json({ error: "Banner not found" })
  await siteService.deleteBanners(req.params.id)
  res.json({ id: req.params.id, deleted: true })
}
