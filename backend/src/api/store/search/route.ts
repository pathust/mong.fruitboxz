import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { findFallbackProducts, searchProducts } from "../../../lib/search"
import { CACHE_KEYS, TTL, cached, resolveCache } from "../../../lib/cache"
import type { SearchQuery } from "../../middlewares/validation"

export async function GET(req: MedusaRequest<unknown, SearchQuery>, res: MedusaResponse) {
  const { q, category, limit, offset, price_range: priceRange, sort } = req.validatedQuery
  const options = { category, priceRange, sort, limit, offset }
  const cache = resolveCache(req.scope)
  const cacheKey = CACHE_KEYS.search(JSON.stringify({ q, ...options }))

  const result = await cached(cache, cacheKey, TTL.search, async () => {
    const meiliResult = await searchProducts(q, options).catch(() => null)
    if (meiliResult) {
      return {
        hits: meiliResult.hits || [],
        total: meiliResult.estimatedTotalHits || 0,
        mode: "meilisearch",
        processing_time_ms: meiliResult.processingTimeMs,
      }
    }

    const fallbackHits = await findFallbackProducts(req.scope, q, options)
    return {
      hits: fallbackHits,
      total: fallbackHits.length,
      mode: "fallback",
    }
  })

  res.json(result)
}
