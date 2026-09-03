import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { resolveSiteService } from "../../../../lib/module-services"
import { sendInternalError } from "../../../../lib/api-error"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const siteService = resolveSiteService(req.scope)
    const [items] = await siteService.listAndCountChatbotQuestionLogs(
      { resolved: false },
      { order: { created_at: "DESC" }, take: 100 }
    )
    res.json({ data: { items: items || [] }, error: null, meta: {} })
  } catch (error) {
    sendInternalError(req, res, error, "Failed to fetch unanswered logs", "CHATBOT_UNANSWERED_FETCH_FAILED")
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const siteService = resolveSiteService(req.scope)
    let idsToDelete: string[] = []
    
    // @ts-ignore
    const body = req.body || {}

    if (body.deleteAll) {
      const [items] = await siteService.listAndCountChatbotQuestionLogs({ resolved: false }, { take: 9999 })
      idsToDelete = items.map(i => i.id)
    } else if (Array.isArray(body.ids)) {
      idsToDelete = body.ids
    }

    if (idsToDelete.length > 0) {
      await siteService.deleteChatbotQuestionLogs(idsToDelete)
    }
    res.json({ data: { success: true, deleted: idsToDelete.length }, error: null, meta: {} })
  } catch (error) {
    sendInternalError(req, res, error, "Failed to delete question logs", "CHATBOT_UNANSWERED_DELETE_FAILED")
  }
}
