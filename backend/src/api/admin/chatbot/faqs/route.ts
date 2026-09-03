import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getGlobalSettings, updateGlobalSettings } from "../../../../lib/global-settings"
import type { ChatbotFaqBody } from "../../../middlewares/validation"
import { resolveSiteService } from "../../../../lib/module-services"
import { sendInternalError } from "../../../../lib/api-error"

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
    sendInternalError(req, res, error, "Failed to fetch FAQs", "CHATBOT_FAQS_FETCH_FAILED")
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
    sendInternalError(req, res, error, "Failed to update FAQs", "CHATBOT_FAQS_UPDATE_FAILED")
  }
}
