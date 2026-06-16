import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const siteService = req.scope.resolve("site") as any
    const [blog_categories] = await siteService.listAndCountBlogCategories({})
    res.json({
      blog_categories: (blog_categories || []).sort((a, b) =>
        String(a?.name || "").localeCompare(String(b?.name || ""))
      ),
    })
  } catch (error: any) {
    res.status(500).json({ message: error.message || "An error occurred while fetching blog categories" })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const siteService = req.scope.resolve("site") as any
    const payload = req.body as any

    if (!payload.name || !payload.slug) {
      return res.status(400).json({ message: "Name and slug are required" })
    }

    const blog_category = await siteService.createBlogCategories(payload)
    res.status(201).json({ blog_category })
  } catch (error: any) {
    res.status(500).json({ message: error.message || "An error occurred while creating blog category" })
  }
}
