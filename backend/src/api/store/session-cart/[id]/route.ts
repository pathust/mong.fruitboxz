import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CACHE_KEYS, TTL, resolveCache } from "../../../../../lib/cache"
import type { UpdateSessionCartSchema } from "./middlewares"

const EMPTY_CART = { items: [], count: 0 }

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cache = resolveCache(req.scope)
  const cart = await cache.get(CACHE_KEYS.cart(req.params.id))
  res.json({ cart: cart || EMPTY_CART })
}

export async function POST(req: MedusaRequest<UpdateSessionCartSchema>, res: MedusaResponse) {
  const cache = resolveCache(req.scope)
  await cache.set(CACHE_KEYS.cart(req.params.id), req.validatedBody, TTL.cart)
  res.json({ cart: req.validatedBody })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const cache = resolveCache(req.scope)
  await cache.invalidate(CACHE_KEYS.cart(req.params.id))
  res.json({ id: req.params.id, deleted: true })
}
