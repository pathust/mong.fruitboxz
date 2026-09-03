import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { resolveSiteService } from "../../../../../lib/module-services"
import { sendInternalError } from "../../../../../lib/api-error"

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const siteService = resolveSiteService(req.scope)
    await siteService.deleteChatbotQuestionLogs([id])
    res.json({ success: true })
  } catch (error) {
    sendInternalError(req, res, error, "Failed to delete question log", "CHATBOT_QUESTION_LOG_DELETE_FAILED")
  }
}
