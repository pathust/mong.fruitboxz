import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getGlobalSettings, updateGlobalSettings } from "../../../lib/global-settings"
import { getSearchStatus, listProductsForSearch, replaceProductIndex } from "../../../lib/search"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const siteService = req.scope.resolve("site") as any
    const settings = await getGlobalSettings(siteService).catch(() => ({}))
    const status = await getSearchStatus()
    res.json({
      ...status,
      last_reindex_at: settings.search_last_reindex_at || null,
    })
  } catch (err: any) {
    res.json({
      configured: Boolean(process.env.MEILI_HOST),
      enabled: false,
      online: false,
      indexed_documents: 0,
      last_reindex_at: null,
      message: err?.message || "Search status unavailable",
    })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const siteService = req.scope.resolve("site") as any
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
  } catch (err: any) {
    res.status(503).json({
      enabled: false,
      indexed: 0,
      message: err?.message || "Reindex failed. Storefront search will keep using catalog fallback.",
    })
  }
}
