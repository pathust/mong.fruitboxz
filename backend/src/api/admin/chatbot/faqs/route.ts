import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getGlobalSettings, updateGlobalSettings } from "../../../../lib/global-settings"
import type { ChatbotFaqBody } from "../../../middlewares/validation"
import { resolveSiteService } from "../../../../lib/module-services"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const siteService = resolveSiteService(req.scope)
    const settings = await getGlobalSettings(siteService)
    res.json({
      data: {
        faqs: Array.isArray(settings.chatbot_faqs) ? settings.chatbot_faqs : [],
        enabled: settings.chatbot_enabled !== false,
      },
      error: null,
      meta: {}
    })
  } catch (error) {
    req.scope.resolve("logger").error("Failed to fetch FAQs", error);
    res.status(500).json({ data: null, error: { message: "Internal server error" }, meta: {} })
  }
}

export async function POST(req: MedusaRequest<ChatbotFaqBody>, res: MedusaResponse) {
  try {
    const siteService = resolveSiteService(req.scope)
    const body = req.validatedBody
    const settings = await updateGlobalSettings(siteService, {
      chatbot_enabled: body.enabled !== false,
      chatbot_faqs: Array.isArray(body.faqs) ? body.faqs : [],
    })
    res.json({
      data: {
        faqs: settings.chatbot_faqs || [],
        enabled: settings.chatbot_enabled !== false,
      },
      error: null,
      meta: {}
    })
  } catch (error) {
    req.scope.resolve("logger").error("Failed to update FAQs", error);
    res.status(500).json({ data: null, error: { message: "Failed to update FAQs" }, meta: {} })
  }
}
