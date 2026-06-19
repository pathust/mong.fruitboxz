import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { BlogCategoryBody } from "../../../middlewares/validation"
import { resolveSiteService } from "../../../../lib/module-services"
import { sendInternalError } from "../../../../lib/api-error"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const siteService = resolveSiteService(req.scope)
    const { id } = req.params

    const blog_category = await siteService.retrieveBlogCategory(id)
    if (!blog_category) {
      return res.status(404).json({ message: "Blog category not found" })
    }

    res.json({ blog_category })
  } catch (error: unknown) {
    sendInternalError(req, res, error, "Unable to fetch blog category", "BLOG_CATEGORY_FETCH_FAILED")
  }
}

export async function POST(req: MedusaRequest<BlogCategoryBody>, res: MedusaResponse) {
  try {
    const siteService = resolveSiteService(req.scope)
    const { id } = req.params
    const payload = req.validatedBody

    const blog_category = await siteService.updateBlogCategories({ id, ...payload })
    res.json({ blog_category })
  } catch (error: unknown) {
    sendInternalError(req, res, error, "Unable to update blog category", "BLOG_CATEGORY_UPDATE_FAILED")
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const siteService = resolveSiteService(req.scope)
    const { id } = req.params

    await siteService.deleteBlogCategories(id)
    res.json({ id, object: "blog_category", deleted: true })
  } catch (error: unknown) {
    sendInternalError(req, res, error, "Unable to delete blog category", "BLOG_CATEGORY_DELETE_FAILED")
  }
}
