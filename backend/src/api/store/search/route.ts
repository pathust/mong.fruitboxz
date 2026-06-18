import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { findFallbackProducts, searchProducts } from "../../../lib/search"
import { CACHE_KEYS, TTL, cached, resolveCache } from "../../../lib/cache"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const q = (req.query?.q || "").toString().trim()
  const category = (req.query?.category || "").toString().trim() || undefined
  const limit = Math.min(24, Math.max(1, Number(req.query?.limit || 12)))
  const offset = Math.max(0, Number(req.query?.offset || 0))
  const priceRange = (req.query?.price_range || "").toString().trim() || undefined
  const requestedSort = (req.query?.sort || "created_at:desc").toString()
  const allowedSorts = new Set(["price:asc", "price:desc", "created_at:desc", "sales_count:desc"])
  const sort = (allowedSorts.has(requestedSort) ? requestedSort : "created_at:desc") as
    "price:asc" | "price:desc" | "created_at:desc" | "sales_count:desc"
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
