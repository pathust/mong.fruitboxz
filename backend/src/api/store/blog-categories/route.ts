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
