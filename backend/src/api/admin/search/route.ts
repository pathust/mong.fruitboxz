import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getGlobalSettings, updateGlobalSettings } from "../../../lib/global-settings"
import { getSearchStatus, listProductsForSearch, replaceProductIndex } from "../../../lib/search"
import { resolveSiteService } from "../../../lib/module-services"
import { sendInternalError } from "../../../lib/api-error"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const siteService = resolveSiteService(req.scope)
    const settings = await getGlobalSettings(siteService).catch(() => ({}))
    const status = await getSearchStatus()
    res.json({
      ...status,
      last_reindex_at: settings.search_last_reindex_at || null,
    })
  } catch (error: unknown) {
    sendInternalError(req, res, error, "Search status unavailable", "SEARCH_STATUS_FAILED")
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const siteService = resolveSiteService(req.scope)
    const products = await listProductsForSearch(req.scope)
    const result = await replaceProductIndex(products)
    if (!result.enabled) {
      return res.status(503).json({
        ...result,
        message: "MeiliSearch is not configured or not reachable. Storefront search will keep using catalog fallback.",
      })
    }
    const updatedSettings = await updateGlobalSettings(siteService, {
      search_last_reindex_at: new Date().toISOString(),
      search_last_reindex_count: result.indexed,
    })
    res.json({
      ...result,
      last_reindex_at: updatedSettings.search_last_reindex_at,
    })
  } catch (error: unknown) {
    const logger = req.scope.resolve<{ error(message: string, error?: unknown): void }>("logger")
    logger.error("Search reindex failed", error)
    res.status(503).json({
      code: "SEARCH_REINDEX_FAILED",
      message: "Reindex failed. Storefront search will keep using catalog fallback.",
    })
  }
}
