import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { resolveSiteService } from "../../../lib/module-services"
import { sendInternalError } from "../../../lib/api-error"
import type { StoreCustomQuery } from "../../middlewares/validation"

export async function GET(req: MedusaRequest<unknown, StoreCustomQuery>, res: MedusaResponse) {
  const { mode } = req.validatedQuery

  try {
    const siteService = resolveSiteService(req.scope)
    const [settingsRows] = await siteService.listAndCountSiteSettings({ key: "global" })
    const [allBanners] = await siteService.listAndCountBanners({})
    const settings = settingsRows?.[0]?.value || {}
    const banners = (allBanners || [])
      .filter((b) => b?.active !== false)
      .sort((a, b) => Number(a?.order ?? 0) - Number(b?.order ?? 0))

    res.json(mode === "homepage" ? { settings, banners } : { settings })
  } catch (error: unknown) {
    sendInternalError(req, res, error, "Unable to load storefront settings", "STOREFRONT_SETTINGS_FAILED")
  }
}
