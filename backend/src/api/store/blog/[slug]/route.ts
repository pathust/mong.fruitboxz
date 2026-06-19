import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { resolveSiteService } from "../../../../lib/module-services"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const siteService = resolveSiteService(req.scope)
  const [blog_posts] = await siteService.listAndCountBlogPosts({
    slug: req.params.slug,
    published: true,
  }, {
    relations: ["category"]
  })
  const blog_post = blog_posts?.[0]
  if (!blog_post) return res.status(404).json({ message: "Blog post not found" })
  res.json({ blog_post })
}
