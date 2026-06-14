import { ExecArgs } from "@medusajs/framework/types"
import { getGlobalSettings, updateGlobalSettings } from "../lib/global-settings"
import { listProductsForSearch, replaceProductIndex } from "../lib/search"

export default async function reindexSearch({ container }: ExecArgs) {
  const siteService = container.resolve("site") as any
  const products = await listProductsForSearch(container)
  const result = await replaceProductIndex(products)
  const settings = await updateGlobalSettings(siteService, {
    search_last_reindex_at: new Date().toISOString(),
    search_last_reindex_count: result.indexed,
  })

  console.log(JSON.stringify({
    indexed: result.indexed,
    enabled: result.enabled,
    last_reindex_at: settings.search_last_reindex_at,
  }, null, 2))
}
