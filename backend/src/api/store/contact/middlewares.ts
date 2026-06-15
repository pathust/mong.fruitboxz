import { MiddlewareRoute, validateAndTransformBody } from "@medusajs/framework"
import { z } from "zod"

export const CreateContactMessageSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional(),
  message: z.string().trim().min(5).max(3000),
})

export type CreateContactMessageSchema = z.infer<typeof CreateContactMessageSchema>

export const contactMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/contact",
    method: "POST",
    middlewares: [validateAndTransformBody(CreateContactMessageSchema)],
  },
]
