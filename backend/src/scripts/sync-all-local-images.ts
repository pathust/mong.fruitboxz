import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import fs from "fs"
import path from "path"
import { importLocalMediaObject } from "../lib/media"

const LOCAL_IMAGES_DIR = path.resolve(process.cwd(), "..", "frontend", "public", "images")

export default async function syncAllLocalImages({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  if (!fs.existsSync(LOCAL_IMAGES_DIR)) {
    logger.info("No local images directory found.")
    return
  }

  const files = fs.readdirSync(LOCAL_IMAGES_DIR)
  let imported = 0

  for (const filename of files) {
    if (!filename.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i)) continue
    
    try {
      await importLocalMediaObject(filename)
      imported++
      if (imported % 50 === 0) {
        logger.info(`Imported ${imported} local images to MinIO...`)
      }
    } catch (err: any) {
      logger.error(`Failed to import ${filename}: ${err.message}`)
    }
  }

  logger.info(`Done. Imported ${imported} images to MinIO.`)
}
