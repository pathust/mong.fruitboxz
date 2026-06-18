import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { CACHE_KEYS, resolveCache } from "../lib/cache"

export default async function productCategoryCacheInvalidation({
  container,
}: SubscriberArgs<{ id: string }>) {
  const cache = resolveCache(container)
  await Promise.all([
    cache.invalidate(CACHE_KEYS.categories),
    cache.invalidate("search:*"),
  ])
}

export const config: SubscriberConfig = {
  event: ["product-category.created", "product-category.updated", "product-category.deleted"],
}
