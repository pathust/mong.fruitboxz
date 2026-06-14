import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import * as fs from "fs"
import * as path from "path"

function readJson<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T
  } catch {
    return fallback
  }
}

export default async function migrateSiteData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const siteService = container.resolve("site") as any

  const dataDir = path.join(process.cwd(), ".medusa", "data")
  const settingsFile = path.join(dataDir, "settings.json")
  const bannersFile = path.join(dataDir, "banners.json")
  const reviewsFile = path.join(dataDir, "reviews.json")

  const [existingSettings] = await siteService.listAndCountSiteSettings({ key: "global" })
  if (!existingSettings?.length) {
    const settings = readJson<Record<string, unknown>>(settingsFile, {})
    if (Object.keys(settings).length > 0) {
      await siteService.createSiteSettings({ key: "global", value: settings })
      logger.info("Migrated settings.json -> site_setting")
    }
  }

  const [existingBanners] = await siteService.listAndCountBanners({})
  if (!existingBanners?.length) {
    const banners = readJson<any[]>(bannersFile, [])
    if (banners.length > 0) {
      await siteService.createBanners(
        banners.map((b, idx) => ({
          title: b.title || "",
          subtitle: b.subtitle || "",
          image: b.image || "",
          link: b.link || "",
          order: Number(b.order ?? idx),
          active: b.active ?? true,
        }))
      )
      logger.info(`Migrated ${banners.length} banners -> site_banner`)
    }
  }

  const [existingReviews] = await siteService.listAndCountReviews({})
  if (!existingReviews?.length) {
    const reviews = readJson<any[]>(reviewsFile, [])
    if (reviews.length > 0) {
      await siteService.createReviews(
        reviews.map((r) => ({
          handle: r.handle || "",
          product_id: r.product_id || null,
          customer_id: r.customer_id || "unknown",
          rating: Number(r.rating) || 5,
          comment: r.comment || "",
          approved: true,
        }))
      )
      logger.info(`Migrated ${reviews.length} reviews -> site_review`)
    }
  }

  logger.info("Site data migration completed")
}
