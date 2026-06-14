import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

// Map handle → real image from seed data
const imageMap: Record<string, string> = {
  "gio-trai-cay-tuoi-nhap-khau": "/images/e3f0c449-ebdf-4f82-bde6-223a8e31e92a.jpeg",
  "set-qua-tang-trai-cay-6-ngan": "/images/2f57b032-2888-499e-9eaa-eea90becc1b6.jpeg",
  "hop-qua-cao-cap-2-tang": "/images/e3f0c449-ebdf-4f82-bde6-223a8e31e92a.jpeg",
  "nuoc-ep-cam-nguyen-chat": "/images/4794856d-7811-4c01-9bc2-23a3a4e9dcbf.jpg",
  "hop-trai-cay-cat-san-mix": "/images/4cf278e7-d649-453e-8d51-f0bedca98652.jpg",
  "sua-chua-hy-lap-trai-cay-tuoi": "/images/8c923776-a2ae-4d53-81f5-9e225cd29909.png",
}

export default async function updateProductImages({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const productModuleService = container.resolve(Modules.PRODUCT)

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "title", "thumbnail", "images.*"],
    pagination: { take: 200 },
  })

  let updated = 0

  for (const product of products) {
    const newImage = imageMap[product.handle]
    if (!newImage) continue

    const currentThumb = product.thumbnail || ""
    const needsUpdate = !currentThumb || currentThumb.includes("placeholder")

    if (!needsUpdate) {
      logger.info(`Skip: ${product.title} (already has image)`)
      continue
    }

    await productModuleService.updateProducts(product.id, {
      thumbnail: newImage,
      images: [{ url: newImage }],
    })

    logger.info(`Updated: ${product.title} → ${newImage}`)
    updated++
  }

  logger.info(`Done. Updated ${updated}/${products.length} products.`)
}
