import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const siteService = req.scope.resolve("site") as any
    const { id } = req.params

    const blog_category = await siteService.retrieveBlogCategory(id)
    if (!blog_category) {
      return res.status(404).json({ message: "Blog category not found" })
    }

    res.json({ blog_category })
  } catch (error: any) {
    res.status(500).json({ message: error.message || "An error occurred while fetching blog category" })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const siteService = req.scope.resolve("site") as any
    const { id } = req.params
    const payload = req.body as any

    const blog_category = await siteService.updateBlogCategories({ id, ...payload })
    res.json({ blog_category })
  } catch (error: any) {
    res.status(500).json({ message: error.message || "An error occurred while updating blog category" })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const siteService = req.scope.resolve("site") as any
    const { id } = req.params

    await siteService.deleteBlogCategories(id)
    res.json({ id, object: "blog_category", deleted: true })
  } catch (error: any) {
    res.status(500).json({ message: error.message || "An error occurred while deleting blog category" })
  }
}
