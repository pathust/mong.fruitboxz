import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getGlobalSettings, updateGlobalSettings } from "../../../../lib/global-settings"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const siteService = req.scope.resolve("site") as any
    const settings = await getGlobalSettings(siteService)
    res.json({
      faqs: Array.isArray(settings.chatbot_faqs) ? settings.chatbot_faqs : [],
      enabled: settings.chatbot_enabled !== false,
    })
  } catch {
    res.json({ faqs: [], enabled: true })
  }
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const siteService = req.scope.resolve("site") as any
  const body = req.body as any
  const settings = await updateGlobalSettings(siteService, {
    chatbot_enabled: body.enabled !== false,
    chatbot_faqs: Array.isArray(body.faqs) ? body.faqs : [],
  })
  res.json({
    faqs: settings.chatbot_faqs || [],
    enabled: settings.chatbot_enabled !== false,
  })
}
