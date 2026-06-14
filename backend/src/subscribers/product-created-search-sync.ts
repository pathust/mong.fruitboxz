import { Modules } from "@medusajs/framework/utils"
import { upsertProductDocument } from "../lib/search"

export default async function productCreatedSearchSync({ event, container }: any) {
  const productModuleService = container.resolve(Modules.PRODUCT)
  const productId = event.data.id
  if (!productId) return
  const product = await productModuleService.retrieveProduct(productId, {
    relations: ["variants", "variants.prices", "categories", "images"],
  }).catch(() => null)
  if (product) {
    await upsertProductDocument(product).catch(() => null)
  }
}

export const config = {
  event: "product.created",
}
