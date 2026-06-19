import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { BannerBody } from "../../middlewares/validation"
import { resolveSiteService } from "../../../lib/module-services"
import { sendInternalError } from "../../../lib/api-error"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const siteService = resolveSiteService(req.scope)
    const [banners] = await siteService.listAndCountBanners({})
    res.json({ banners })
  } catch (error: unknown) {
    sendInternalError(req, res, error, "Unable to fetch banners", "BANNER_LIST_FAILED")
  }
}

export async function POST(req: MedusaRequest<BannerBody>, res: MedusaResponse) {
  try {
    const siteService = resolveSiteService(req.scope)
    const body = req.validatedBody

    const [existing] = await siteService.listAndCountBanners({})
    const banner = await siteService.createBanners({
      title: body.title || "",
      subtitle: body.subtitle || "",
      image: body.image || "",
      link: body.link || "",
      order: body.order ?? existing.length,
      active: body.active ?? true,
    })
    res.status(201).json({ banner })
  } catch (error: unknown) {
    sendInternalError(req, res, error, "Unable to create banner", "BANNER_CREATE_FAILED")
  }
}
