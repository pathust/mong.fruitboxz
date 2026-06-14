import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { findFallbackProducts, searchProducts } from "../../../lib/search"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const q = (req.query?.q || "").toString().trim()
  const category = (req.query?.category || "").toString().trim() || undefined
  const limit = Math.min(24, Math.max(1, Number(req.query?.limit || 12)))
  const offset = Math.max(0, Number(req.query?.offset || 0))

  if (!q) {
    return res.json({ hits: [], total: 0, mode: "empty" })
  }

  const meiliResult = await searchProducts(q, category, limit, offset).catch(() => null)
  if (meiliResult) {
    return res.json({
      hits: meiliResult.hits || [],
      total: meiliResult.estimatedTotalHits || 0,
      mode: "meilisearch",
      processing_time_ms: meiliResult.processingTimeMs,
    })
  }

  const fallbackHits = await findFallbackProducts(req.scope, q, category, limit)
  res.json({
    hits: fallbackHits,
    total: fallbackHits.length,
    mode: "fallback",
  })
}
