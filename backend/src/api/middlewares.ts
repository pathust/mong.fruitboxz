import { defineMiddlewares, authenticate } from "@medusajs/framework/http"
import { rbacMiddleware } from "./middlewares/rbac"
import { contactMiddlewares } from "./store/contact/middlewares"

export default defineMiddlewares({
  routes: [
    ...contactMiddlewares,
    {
      matcher: "/admin/products*",
      middlewares: [authenticate("user", ["bearer", "session"]), rbacMiddleware],
    },
    {
      matcher: "/admin/orders*",
      middlewares: [authenticate("user", ["bearer", "session"]), rbacMiddleware],
    },
    {
      matcher: "/admin/product-categories*",
      middlewares: [authenticate("user", ["bearer", "session"]), rbacMiddleware],
    },
    {
      matcher: "/admin/custom*",
      middlewares: [authenticate("user", ["bearer", "session"]), rbacMiddleware],
    },
    {
      matcher: "/admin/media*",
      middlewares: [authenticate("user", ["bearer", "session"]), rbacMiddleware],
    },
    {
      matcher: "/admin/permissions*",
      middlewares: [authenticate("user", ["bearer", "session"]), rbacMiddleware],
    },
    {
      matcher: "/admin/roles*",
      middlewares: [authenticate("user", ["bearer", "session"]), rbacMiddleware],
    },
    {
      matcher: "/admin/settings*",
      middlewares: [authenticate("user", ["bearer", "session"]), rbacMiddleware],
    },
    {
      matcher: "/admin/search*",
      middlewares: [authenticate("user", ["bearer", "session"]), rbacMiddleware],
    },
    {
      matcher: "/admin/chatbot*",
      middlewares: [authenticate("user", ["bearer", "session"]), rbacMiddleware],
    },
    {
      matcher: "/admin/reviews*",
      middlewares: [authenticate("user", ["bearer", "session"]), rbacMiddleware],
    },
    {
      matcher: "/admin/users*",
      middlewares: [authenticate("user", ["bearer", "session"]), rbacMiddleware],
    },
    {
      matcher: "/admin/banners*",
      middlewares: [authenticate("user", ["bearer", "session"]), rbacMiddleware],
    },
    {
      matcher: "/admin/blog-posts*",
      middlewares: [authenticate("user", ["bearer", "session"]), rbacMiddleware],
    },
    // Fix: Các route admin bị thiếu middleware bảo vệ
    {
      matcher: "/admin/promotions*",
      middlewares: [authenticate("user", ["bearer", "session"]), rbacMiddleware],
    },
    {
      matcher: "/admin/customers*",
      middlewares: [authenticate("user", ["bearer", "session"]), rbacMiddleware],
    },
    {
      matcher: "/admin/inventory-items*",
      middlewares: [authenticate("user", ["bearer", "session"]), rbacMiddleware],
    },
    {
      matcher: "/admin/price-lists*",
      middlewares: [authenticate("user", ["bearer", "session"]), rbacMiddleware],
    },
  ],
})
