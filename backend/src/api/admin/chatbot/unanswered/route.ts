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
