import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { normalizeBlogPostPayload } from "../../../lib/blog"
import type { BlogPostBody } from "../../middlewares/validation"
import { resolveSiteService } from "../../../lib/module-services"
import { sendInternalError } from "../../../lib/api-error"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const siteService = resolveSiteService(req.scope)
    const [blog_posts] = await siteService.listAndCountBlogPosts({}, { relations: ["category"] })
    res.json({
      blog_posts: (blog_posts || []).sort((a, b) =>
        String(b?.published_at || b?.created_at || "").localeCompare(String(a?.published_at || a?.created_at || ""))
      ),
    })
  } catch (error: unknown) {
    sendInternalError(req, res, error, "Unable to fetch blog posts", "BLOG_POST_LIST_FAILED")
  }
}

export async function POST(req: MedusaRequest<BlogPostBody>, res: MedusaResponse) {
  try {
    const siteService = resolveSiteService(req.scope)
    const payload = normalizeBlogPostPayload(req.validatedBody)

    const blog_post = await siteService.createBlogPosts(payload)
    res.status(201).json({ blog_post })
  } catch (error: unknown) {
    sendInternalError(req, res, error, "Unable to create blog post", "BLOG_POST_CREATE_FAILED")
  }
}
