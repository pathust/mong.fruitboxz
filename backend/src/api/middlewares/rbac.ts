import type {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework/http"
import { getUserPermissions } from "../../lib/rbac"

function getRequiredPermissions(path: string, method: string) {
  if (path.startsWith("/admin/users/me") || path.startsWith("/admin/auth")) return []

  const moduleName = path.match(/^\/admin\/([a-zA-Z0-9-]+)/)?.[1]
  if (!moduleName) return []

  const protectedModules = new Set([
    "products", "product-categories", "orders", "users", "banners", "roles",
    "permissions", "settings", "reviews", "media", "search", "chatbot", "blog-posts",
    "promotions", "customers", "inventory-items", "price-lists",
  ])
  if (!protectedModules.has(moduleName)) return []

  const permissionModule = moduleName === "product-categories"
    ? "categories"
    : (moduleName === "blog-posts" || moduleName === "chatbot") ? "settings" : moduleName
  const hasEntityTarget = path.split("/").filter(Boolean).length > 2
  const action = method === "DELETE"
    ? "delete"
    : method === "POST" && !hasEntityTarget && permissionModule !== "settings" ? "create"
    : method === "GET" ? "read" : "edit"
  const aliases: Record<string, string[]> = {
    read: ["read", "view", "list"],
    create: ["create", "add", "write"],
    edit: ["edit", "update", "write"],
    delete: ["delete", "remove", "write"],
  }

  return aliases[action].map((alias) => `${permissionModule}.${alias}`)
}

export async function rbacMiddleware(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const actorId = typeof req.auth_context.app_metadata?.user_id === "string"
    ? req.auth_context.app_metadata.user_id
    : req.auth_context.actor_id
  const requiredPermissions = getRequiredPermissions(req.path || "", req.method.toUpperCase())
  if (!actorId || !requiredPermissions.length) return next()

  try {
    const permissions = await getUserPermissions(req.scope, actorId)
    const allowed = permissions.includes("*") || permissions.some((permission) => (
      requiredPermissions.includes(permission)
    ))

    if (!allowed) {
      return res.status(403).json({
        code: "FORBIDDEN",
        message: `Requires one of: ${requiredPermissions.join(", ")}`,
      })
    }

    return next()
  } catch (error: unknown) {
    const logger = req.scope.resolve<{ error(message: string, error?: unknown): void }>("logger")
    logger.error("RBAC permission check failed", error)
    return res.status(500).json({ code: "RBAC_CHECK_FAILED", message: "Unable to verify permissions" })
  }
}
