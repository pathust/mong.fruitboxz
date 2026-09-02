import type {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework/http"
import { getUserPermissions } from "../../lib/rbac"

const PERMISSION_ALIASES: Record<string, string[]> = {
  read: ["read", "view", "list"],
  create: ["create", "add", "write"],
  edit: ["edit", "update", "write"],
  delete: ["delete", "remove", "write"],
}

function permissionsForAction(permissionModule: string, action: keyof typeof PERMISSION_ALIASES) {
  return PERMISSION_ALIASES[action].map((alias) => `${permissionModule}.${alias}`)
}

function inferAction(method: string, hasEntityTarget: boolean, permissionModule: string): keyof typeof PERMISSION_ALIASES {
  if (method === "DELETE") return "delete"
  if (method === "POST" && !hasEntityTarget && permissionModule !== "settings") return "create"
  if (method === "GET") return "read"
  return "edit"
}

function getRequiredPermissions(path: string, method: string) {
  if (path.startsWith("/admin/users/me") || path.startsWith("/admin/auth")) return []

  const segments = path.split("/").filter(Boolean)
  const moduleName = segments[1]
  if (!moduleName) return []

  // /admin/custom/* bundles several unrelated resources under one URL
  // prefix (revenue dashboard, cost settings, order-status writes,
  // inventory writes). Matching only the first path segment would collapse
  // all of them into a single "custom" permission that doesn't correspond
  // to any role permission that actually exists — resolve the real
  // resource from the sub-path instead, one level deep.
  if (moduleName === "custom") {
    if (segments[2] === "orders") {
      return permissionsForAction("orders", inferAction(method, true, "orders"))
    }
    if (segments[2] === "inventory") {
      return permissionsForAction("inventory", inferAction(method, segments.length > 3, "inventory"))
    }
    // Bare /admin/custom (GET ?mode=dashboard|settings, POST ?mode=settings).
    // GET accepts either the finance-dashboard or the settings permission
    // (Manager holds finance.read but not settings.read, and both are
    // legitimate viewers of this endpoint); POST (settings mutation) is
    // held to the stricter settings.edit, matching the sibling
    // /admin/settings route.
    if (method === "GET") {
      return [...permissionsForAction("finance", "read"), ...permissionsForAction("settings", "read")]
    }
    return permissionsForAction("settings", "edit")
  }

  const protectedModules = new Set([
    "products", "product-categories", "orders", "users", "banners", "roles",
    "permissions", "settings", "media", "search", "chatbot", "blog-posts",
    "promotions", "customers", "inventory-items", "price-lists",
    "ingredients", "recipes", "blog-categories", "reviews",
  ])
  if (!protectedModules.has(moduleName)) return []

  const permissionModule = moduleName === "product-categories" ? "categories"
    : (moduleName === "blog-posts" || moduleName === "chatbot") ? "settings"
    // No dedicated "recipes"/"reviews" permission bucket is seeded — recipes
    // are ingredient BOM data (gate them like ingredients), reviews are
    // customer-generated content (gate them like the generic "content"
    // bucket, which exists in the seed catalog but isn't wired to any
    // other route yet).
    : moduleName === "recipes" ? "ingredients"
    : moduleName === "reviews" ? "content"
    : moduleName

  const hasEntityTarget = segments.length > 2
  return permissionsForAction(permissionModule, inferAction(method, hasEntityTarget, permissionModule))
}

export async function rbacMiddleware(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const actorId = typeof req.auth_context.app_metadata?.user_id === "string"
    ? req.auth_context.app_metadata.user_id
    : req.auth_context.actor_id
  // req.path is relative to this middleware's mount point ("/admin/*"), so
  // it's just "/" for e.g. "/admin/roles" — it can NEVER be used to derive
  // the resource here. req.originalUrl carries the real full path (plus
  // query string, stripped below).
  const fullPath = (req.originalUrl || req.url || "").split("?")[0]
  const requiredPermissions = getRequiredPermissions(fullPath, req.method.toUpperCase())
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
