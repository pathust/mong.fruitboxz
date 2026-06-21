import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { resolveSiteService } from "../../../../lib/module-services"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const siteService = resolveSiteService(req.scope)
    const [items] = await siteService.listAndCountChatbotQuestionLogs(
      { resolved: false },
      { order: { created_at: "DESC" }, take: 100 }
    )
    res.json({ items: items || [] })
  } catch {
    res.json({ items: [] })
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
    res.json({ success: true, deleted: idsToDelete.length })
  } catch (error) {
    res.status(500).json({ error: "Failed to delete question logs" })
  }
}
