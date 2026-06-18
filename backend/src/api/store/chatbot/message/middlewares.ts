import { MiddlewareRoute, validateAndTransformBody } from "@medusajs/framework"
import { z } from "zod"

export const ChatbotMessageSchema = z.object({
  message: z.string().trim().min(1).max(1000),
})

export type ChatbotMessageSchema = z.infer<typeof ChatbotMessageSchema>

export const chatbotMessageMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/chatbot/message",
    method: "POST",
    middlewares: [validateAndTransformBody(ChatbotMessageSchema)],
  },
]
