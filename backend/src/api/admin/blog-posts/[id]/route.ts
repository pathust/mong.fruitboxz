import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { normalizeBlogPostPayload } from "../../../../lib/blog"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const siteService = req.scope.resolve("site") as any
  const blog_post = await siteService.retrieveBlogPost(req.params.id, {
    relations: ["category"]
  }).catch(() => null)
  if (!blog_post) return res.status(404).json({ message: "Blog post not found" })
  res.json({ blog_post })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const siteService = req.scope.resolve("site") as any
    const payload = normalizeBlogPostPayload(req.body as any)
    const blog_post = await siteService.updateBlogPosts({
      id: req.params.id,
      ...payload,
    })
    res.json({ blog_post })
  } catch (error: any) {
    res.status(500).json({ message: error.message || "An error occurred while updating blog post" })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const siteService = req.scope.resolve("site") as any
  await siteService.deleteBlogPosts(req.params.id)
  res.status(204).send()
}

