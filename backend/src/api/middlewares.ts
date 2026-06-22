import { defineMiddlewares, authenticate } from "@medusajs/framework/http"
import { rbacMiddleware } from "./middlewares/rbac"
import { contactMiddlewares } from "./store/contact/middlewares"
import { chatbotMessageMiddlewares } from "./store/chatbot/message/middlewares"
import { sessionCartMiddlewares } from "./store/session-cart/[id]/middlewares"
import { apiEnvelopeMiddlewares } from "./middlewares/api-envelope"
import { customValidationMiddlewares } from "./middlewares/validation"

export default defineMiddlewares({
  routes: [
    ...apiEnvelopeMiddlewares,

    {
      matcher: "/store/checkout",
      method: "GET",
      middlewares: [authenticate("customer", ["bearer", "session"])],
    },
    {
      matcher: "/store/checkout",
      method: "POST",
      middlewares: [authenticate("customer", ["bearer", "session"], { allowUnauthenticated: true })],
    },
    ...customValidationMiddlewares,
    ...contactMiddlewares,
    ...chatbotMessageMiddlewares,
    ...sessionCartMiddlewares,
    {
      matcher: "/admin/*",
      middlewares: [authenticate("user", ["bearer", "session"]), rbacMiddleware],
    },
    {
      matcher: "/admin/price-lists*",
      middlewares: [authenticate("user", ["bearer", "session"]), rbacMiddleware],
    },
  ],
})
