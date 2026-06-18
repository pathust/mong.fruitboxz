import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const siteService = req.scope.resolve("site") as any
  const [blog_posts] = await siteService.listAndCountBlogPosts({ published: true }, {
    relations: ["category"]
  })
  res.json({
    blog_posts: (blog_posts || []).sort((a, b) =>
      String(b?.published_at || b?.created_at || "").localeCompare(String(a?.published_at || a?.created_at || ""))
    ),
  })
}

