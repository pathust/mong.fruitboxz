import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const siteService = req.scope.resolve("site") as any
    const [items] = await siteService.listAndCountChatbotQuestionLogs(
      { resolved: false },
      { order: { created_at: "DESC" }, take: 100 }
    )
    res.json({ items: items || [] })
  } catch {
    res.json({ items: [] })
  }
}
