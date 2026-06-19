import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { normalizeBlogPostPayload } from "../../../../lib/blog"
import type { BlogPostBody } from "../../../middlewares/validation"
import { resolveSiteService } from "../../../../lib/module-services"
import { sendInternalError } from "../../../../lib/api-error"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const siteService = resolveSiteService(req.scope)
  const blog_post = await siteService.retrieveBlogPost(req.params.id, {
    relations: ["category"]
  }).catch(() => null)
  if (!blog_post) return res.status(404).json({ message: "Blog post not found" })
  res.json({ blog_post })
}

export async function POST(req: MedusaRequest<BlogPostBody>, res: MedusaResponse) {
  try {
    const siteService = resolveSiteService(req.scope)
    const payload = normalizeBlogPostPayload(req.validatedBody)
    const blog_post = await siteService.updateBlogPosts({
      id: req.params.id,
      ...payload,
    })
    res.json({ blog_post })
  } catch (error: unknown) {
    sendInternalError(req, res, error, "Unable to update blog post", "BLOG_POST_UPDATE_FAILED")
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const siteService = resolveSiteService(req.scope)
  await siteService.deleteBlogPosts(req.params.id)
  res.status(204).send()
}
