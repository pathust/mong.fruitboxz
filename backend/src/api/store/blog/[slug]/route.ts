import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const siteService = req.scope.resolve("site") as any
  const [blog_posts] = await siteService.listAndCountBlogPosts({
    slug: req.params.slug,
    published: true,
  })
  const blog_post = blog_posts?.[0]
  if (!blog_post) return res.status(404).json({ message: "Blog post not found" })
  res.json({ blog_post })
}

