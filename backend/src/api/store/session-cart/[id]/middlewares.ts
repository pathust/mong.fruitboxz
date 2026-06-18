import { MiddlewareRoute, validateAndTransformBody } from "@medusajs/framework"
import { z } from "zod"

const SessionCartItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  price: z.number().nonnegative(),
  image: z.string().optional(),
  quantity: z.number().int().min(1).max(99),
  slug: z.string().optional(),
  variantLabel: z.string().optional(),
  variantId: z.string().nullable().optional(),
  productId: z.string().nullable().optional(),
})

export const UpdateSessionCartSchema = z.object({
  items: z.array(SessionCartItemSchema).max(100),
  count: z.number().int().nonnegative(),
})

export type UpdateSessionCartSchema = z.infer<typeof UpdateSessionCartSchema>

export const sessionCartMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/session-cart/:id",
    method: "POST",
    middlewares: [validateAndTransformBody(UpdateSessionCartSchema)],
  },
]
