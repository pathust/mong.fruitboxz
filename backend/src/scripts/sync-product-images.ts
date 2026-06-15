import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import fs from "fs"
import path from "path"
import { importLocalMediaObject } from "../lib/media"
import { resolveLocalProductImages } from "../lib/product-images"

const PRODUCTS_FILE = path.resolve(process.cwd(), "../frontend/src/data/products.json")

export default async function syncProductImages({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const sourceProducts = JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf8"))
  const sourceByHandle = new Map(
    sourceProducts.map((product: any, index: number) => [
      product.handle || product.id || `handle-${index}`,
      product,
    ])
  )
  const localImagesByHandle = new Map<string, string[]>()
  const uniqueFilenames = new Set<string>()

  for (const [handle, source] of sourceByHandle) {
    const localImages = resolveLocalProductImages(source as any)
    localImagesByHandle.set(handle as string, localImages)
    localImages.forEach((url) => uniqueFilenames.add(path.basename(url)))
  }

  const mediaUrlByFilename = new Map<string, string>()
  let imported = 0
  for (const filename of uniqueFilenames) {
    const media = await importLocalMediaObject(filename)
    mediaUrlByFilename.set(filename, media.url)
    imported++
    if (imported % 25 === 0 || imported === uniqueFilenames.size) {
      logger.info(`Prepared media ${imported}/${uniqueFilenames.size}`)
    }
  }

  const { data: dbProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "title"],
    pagination: { take: 1000 },
  })

  const updates = dbProducts.flatMap((product) => {
    const localImages = localImagesByHandle.get(product.handle) || []
    const images = localImages
      .map((url) => mediaUrlByFilename.get(path.basename(url)))
      .filter((url): url is string => Boolean(url))
    if (!images.length) {
      logger.warn(`No local image found for: ${product.title} (${product.handle})`)
      return []
    }

    return [{
      id: product.id,
      thumbnail: images[0],
      images: images.map((url) => ({ url })),
    }]
  })

  const chunkSize = 25
  for (let index = 0; index < updates.length; index += chunkSize) {
    const chunk = updates.slice(index, index + chunkSize)
    await updateProductsWorkflow(container).run({
      input: { products: chunk },
    })
    logger.info(`Synced product images ${index + chunk.length}/${updates.length}`)
  }

  logger.info(`Done. Synced images for ${updates.length}/${dbProducts.length} products.`)
}
