import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { resolveSiteService } from "../../../lib/module-services"
import { sendInternalError } from "../../../lib/api-error"
import type { StoreCustomQuery } from "../../middlewares/validation"

export async function GET(req: MedusaRequest<unknown, StoreCustomQuery>, res: MedusaResponse) {
  const { mode } = req.validatedQuery

  try {
    const siteService = resolveSiteService(req.scope)
    const [settingsRows] = await siteService.listAndCountSiteSettings({ key: "global" })
    const [banners] = await siteService.listAndCountBanners(
      { active: true },
      { order: { order: "ASC" } }
    )
    const settings = settingsRows?.[0]?.value || {}

    res.json(mode === "homepage" ? { settings, banners } : { settings })
  } catch (error: unknown) {
    sendInternalError(req, res, error, "Unable to load frontend settings", "FRONTEND_SETTINGS_FAILED")
  }
}
