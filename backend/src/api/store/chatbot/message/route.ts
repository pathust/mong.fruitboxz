import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { buildChatbotReply } from "../../../../lib/chatbot"
import { getGlobalSettings } from "../../../../lib/global-settings"
import { normalizeAddress } from "../../../../lib/geocoding"
import { consumeRateLimit } from "../../../../lib/redis"
import type { ChatbotMessageSchema } from "./middlewares"
import { resolveSiteService } from "../../../../lib/module-services"

export async function POST(req: MedusaRequest<ChatbotMessageSchema>, res: MedusaResponse) {
  const limit = Number(process.env.CHATBOT_RATE_LIMIT || 20)
  const windowSeconds = Number(process.env.CHATBOT_RATE_WINDOW_SECONDS || 60)
  const clientId = req.ip || req.socket.remoteAddress || "unknown"
  const rateLimit = await consumeRateLimit(`rate:chatbot:${clientId}`, limit, windowSeconds)
  res.setHeader("X-RateLimit-Remaining", String(rateLimit.remaining))
  if (!rateLimit.allowed) {
    res.setHeader("Retry-After", String(rateLimit.retryAfter))
    return res.status(429).json({
      error: {
        code: "CHATBOT_RATE_LIMITED",
        message: "Too many chatbot requests",
        details: { retry_after_seconds: rateLimit.retryAfter },
      },
    })
  }

  const siteService = resolveSiteService(req.scope)
  const settings = await getGlobalSettings(siteService)
  const { message } = req.validatedBody

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
