import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { removeProductDocument } from "../lib/search"
import { CACHE_KEYS, resolveCache } from "../lib/cache"

export default async function productDeletedSearchSync({ event, container }: SubscriberArgs<{ id: string }>) {
  const productId = event.data.id
  if (!productId) return
  const cache = resolveCache(container)
  await Promise.all([
    removeProductDocument(productId).catch(() => null),
    cache.invalidate(CACHE_KEYS.product(productId)),
    cache.invalidate("search:*")
  ])
}

export const config: SubscriberConfig = {
  event: "product.deleted",
}
