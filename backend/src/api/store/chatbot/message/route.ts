import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { buildChatbotReply } from "../../../../lib/chatbot"
import { getGlobalSettings } from "../../../../lib/global-settings"
import { normalizeAddress } from "../../../../lib/geocoding"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const siteService = req.scope.resolve("site") as any
  const settings = await getGlobalSettings(siteService)
  const message = (req.body as any)?.message?.toString?.().trim?.() || ""

  if (!message) {
    return res.status(400).json({ message: "Missing chatbot message" })
  }

  const reply = await buildChatbotReply({
    message,
    scope: req.scope,
    settings,
  })

  await siteService.createChatbotQuestionLogs({
    message,
    normalized_message: normalizeAddress(message),
    response_mode: reply.mode,
    resolved: reply.mode !== "fallback",
    metadata: {
      suggestions: reply.suggestions?.length || 0,
    },
  }).catch(() => null)

  res.json(reply)
}
