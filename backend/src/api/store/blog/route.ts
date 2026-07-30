import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { resolveSiteService } from "../../../lib/module-services"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const siteService = resolveSiteService(req.scope)
  const [blog_posts] = await siteService.listAndCountBlogPosts({ published: true }, {
    relations: ["category"],
    order: { published_at: "DESC", created_at: "DESC" },
  })
  res.json({ blog_posts })
}
