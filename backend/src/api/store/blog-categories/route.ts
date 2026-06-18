import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const siteService = req.scope.resolve("site") as any
    const payload = req.body as any
    console.log("PAYLOAD:", payload)
    const blog_category = await siteService.createBlogCategories(payload)
    res.json({ blog_category })
  } catch (error: any) {
    console.error("STORE_CATEGORY_ERROR:", error)
    res.status(500).json({ message: error.message, stack: error.stack })
  }
}
