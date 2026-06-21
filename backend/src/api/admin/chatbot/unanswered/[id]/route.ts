import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { resolveSiteService } from "../../../../../lib/module-services"

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const siteService = resolveSiteService(req.scope)
    await siteService.deleteChatbotQuestionLogs([id])
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: "Failed to delete question log" })
  }
}
