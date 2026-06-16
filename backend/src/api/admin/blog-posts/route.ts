import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { normalizeBlogPostPayload } from "../../../lib/blog"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const siteService = req.scope.resolve("site") as any
    const [blog_posts] = await siteService.listAndCountBlogPosts({})
    res.json({
      blog_posts: (blog_posts || []).sort((a, b) =>
        String(b?.published_at || b?.created_at || "").localeCompare(String(a?.published_at || a?.created_at || ""))
      ),
    })
  } catch (error: any) {
    res.status(500).json({ message: error.message || "An error occurred while fetching blog posts" })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const siteService = req.scope.resolve("site") as any
    const payload = normalizeBlogPostPayload(req.body as any)

    if (!payload.title || !payload.slug) {
      return res.status(400).json({ message: "Title and slug are required" })
    }

    const blog_post = await siteService.createBlogPosts(payload)
    res.status(201).json({ blog_post })
  } catch (error: any) {
    res.status(500).json({ message: error.message || "An error occurred while creating blog post" })
  }
}

