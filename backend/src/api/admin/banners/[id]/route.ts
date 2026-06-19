import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { BannerBody } from "../../../middlewares/validation"
import { resolveSiteService } from "../../../../lib/module-services"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const siteService = resolveSiteService(req.scope)
  const banner = await siteService.retrieveBanner(req.params.id).catch(() => null)
  if (!banner) return res.status(404).json({ error: "Banner not found" })
  res.json({ banner })
}

export async function POST(req: MedusaRequest<BannerBody>, res: MedusaResponse) {
  const siteService = resolveSiteService(req.scope)
  const existing = await siteService.retrieveBanner(req.params.id).catch(() => null)
  if (!existing) return res.status(404).json({ error: "Banner not found" })
  const body = req.validatedBody
  const banner = await siteService.updateBanners({
    id: req.params.id,
    ...body,
    updated_at: new Date().toISOString(),
  })
  res.json({ banner })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const siteService = resolveSiteService(req.scope)
  const existing = await siteService.retrieveBanner(req.params.id).catch(() => null)
  if (!existing) return res.status(404).json({ error: "Banner not found" })
  await siteService.deleteBanners(req.params.id)
  res.json({ id: req.params.id, deleted: true })
}
