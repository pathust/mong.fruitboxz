import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

export default async function fixProductImages({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const productModuleService = container.resolve(Modules.PRODUCT)

  const { data: all } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "title", "thumbnail", "images.*"],
    pagination: { take: 100 },
  })

  let updated = 0

  for (const product of all) {
    const thumb = product.thumbnail
    const images = product.images || []

    const needsFix = (thumb && !thumb.startsWith("/images/")) ||
      images.some(img => img.url && !img.url.startsWith("/images/"))

    if (!needsFix) continue

    const localImage = images.find(img => img.url?.startsWith("/images/"))?.url
    const localThumb = thumb?.startsWith("/images/") ? thumb : (localImage || "/images/placeholder.svg")

    await productModuleService.updateProducts(product.id, {
      thumbnail: localThumb,
      images: [{ url: localThumb }],
    })

    logger.info(`Fixed: ${product.title} -> ${localThumb}`)
    updated++
  }

  logger.info(`Done. Updated ${updated}/${all.length} products.`)
}
