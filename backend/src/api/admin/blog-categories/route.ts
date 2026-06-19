import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { BlogCategoryBody } from "../../middlewares/validation"
import { resolveSiteService } from "../../../lib/module-services"
import { sendInternalError } from "../../../lib/api-error"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const siteService = resolveSiteService(req.scope)
    const [blog_categories] = await siteService.listAndCountBlogCategories({})
    res.json({
      blog_categories: (blog_categories || []).sort((a, b) =>
        String(a?.name || "").localeCompare(String(b?.name || ""))
      ),
    })
  } catch (error: unknown) {
    sendInternalError(req, res, error, "Unable to fetch blog categories", "BLOG_CATEGORY_LIST_FAILED")
  }
}

export async function POST(req: MedusaRequest<BlogCategoryBody>, res: MedusaResponse) {
  try {
    const siteService = resolveSiteService(req.scope)
    const payload = req.validatedBody

    const blog_category = await siteService.createBlogCategories(payload)
    res.status(201).json({ blog_category })
  } catch (error: unknown) {
    sendInternalError(req, res, error, "Unable to create blog category", "BLOG_CATEGORY_CREATE_FAILED")
  }
}
