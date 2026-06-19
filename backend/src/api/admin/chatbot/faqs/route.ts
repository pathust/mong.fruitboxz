import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getGlobalSettings, updateGlobalSettings } from "../../../../lib/global-settings"
import type { ChatbotFaqBody } from "../../../middlewares/validation"
import { resolveSiteService } from "../../../../lib/module-services"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const siteService = resolveSiteService(req.scope)
    const settings = await getGlobalSettings(siteService)
    res.json({
      faqs: Array.isArray(settings.chatbot_faqs) ? settings.chatbot_faqs : [],
      enabled: settings.chatbot_enabled !== false,
    })
  } catch {
    res.json({ faqs: [], enabled: true })
  }
}

export async function POST(req: MedusaRequest<ChatbotFaqBody>, res: MedusaResponse) {
  const siteService = resolveSiteService(req.scope)
  const body = req.validatedBody
  const settings = await updateGlobalSettings(siteService, {
    chatbot_enabled: body.enabled !== false,
    chatbot_faqs: Array.isArray(body.faqs) ? body.faqs : [],
  })
  res.json({
    faqs: settings.chatbot_faqs || [],
    enabled: settings.chatbot_enabled !== false,
  })
}
