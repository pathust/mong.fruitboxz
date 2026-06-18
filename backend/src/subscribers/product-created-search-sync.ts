import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { upsertProductDocument, type ProductRecord } from "../lib/search"
import { CACHE_KEYS, resolveCache } from "../lib/cache"

export default async function productCreatedSearchSync({ event, container }: SubscriberArgs<{ id: string }>) {
  const productModuleService = container.resolve(Modules.PRODUCT)
  const productId = event.data.id
  if (!productId) return
  const product = await productModuleService.retrieveProduct(productId, {
    relations: ["variants", "variants.prices", "categories", "images"],
  }).catch(() => null)
  if (product) {
    const cache = resolveCache(container)
    await Promise.all([
      upsertProductDocument(product as unknown as ProductRecord).catch(() => null),
      cache.invalidate(CACHE_KEYS.product(product.handle || product.id)),
      cache.invalidate("search:*")
    ])
  }
}

export const config: SubscriberConfig = {
  event: "product.created",
}
