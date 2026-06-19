import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { resolveSiteService } from "../../../lib/module-services"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const siteService = resolveSiteService(req.scope)
  const [blogCategories, count] = await siteService.listAndCountBlogCategories(
    {},
    { order: { name: "ASC" } }
  )

  res.json({ items: blogCategories, count, offset: 0, limit: count })
}
