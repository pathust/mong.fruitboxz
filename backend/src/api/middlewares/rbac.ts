import type { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework/http"

export async function rbacMiddleware(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  const authContext = (req as any).auth_context
  const actorId = authContext?.app_metadata?.user_id || authContext?.actor_id

  // If no actorId, user is not logged in. Let the standard authentication handle it.
  if (!actorId) {
    return next()
  }

  // Parse path to determine module
  const path = req.path || ""
  const method = req.method?.toUpperCase() || "GET"

  // Bypass routes that don't need strict module permissions
  if (path.startsWith("/admin/users/me") || path.startsWith("/admin/auth")) {
    return next()
  }

  // Extract module name from path: /admin/products/... -> products
  // Example: /admin/product-categories -> product-categories
  const match = path.match(/^\/admin\/([a-zA-Z0-9-]+)/)
  if (!match) {
    return next()
  }

  const moduleName = match[1]

  // Some endpoints might not need RBAC or should just be passed through
  // If it's a known module we map it to permissions
  const readModules = new Set([
    "products", "product-categories", "orders", "users", "banners", "roles",
    "permissions", "settings", "reviews", "media", "search", "chatbot", "blog-posts"
  ])

  // Standardize module names for permissions
  let permModule = moduleName
  if (moduleName === "product-categories") permModule = "categories"
  if (moduleName === "blog-posts") permModule = "settings"

  if (!readModules.has(moduleName)) {
    return next()
  }

  const segments = path.split("/").filter(Boolean)
  const hasEntityTarget = segments.length > 2
  let requiredAction = "read"

  if (method === "DELETE") {
    requiredAction = "delete"
  } else if (method === "PUT" || method === "PATCH") {
    requiredAction = "edit"
  } else if (method === "POST") {
    requiredAction = hasEntityTarget || permModule === "settings" ? "edit" : "create"
  }

  const actionAliases: Record<string, string[]> = {
    read: ["read", "view", "list"],
    create: ["create", "add", "write"],
    edit: ["edit", "update", "write"],
    delete: ["delete", "remove", "write"],
  }
  const requiredPermissions = (actionAliases[requiredAction] || [requiredAction]).map((action) => `${permModule}.${action}`)

  // Now resolve user and check permissions
  const userService = req.scope.resolve("user") as any
  const rbacService = req.scope.resolve("rbac") as any

  try {
    const user = await userService.retrieveUser(actorId, { select: ["id", "email", "metadata"] })

    // Superadmin bypass
    if (user.email === "taiphan@mong.vn") {
      return next()
    }

    const roleIds = user.metadata?.roles || []
    if (!Array.isArray(roleIds) || roleIds.length === 0) {
      return res.status(403).json({ error: `Forbidden: requires one of ${requiredPermissions.join(", ")}` })
    }

    const roles = await rbacService.listRoles({ id: roleIds })
    const permissionIds = new Set<string>()
    for (const role of roles) {
      if (Array.isArray(role.permissions)) {
        for (const pId of role.permissions) {
          permissionIds.add(pId)
        }
      }
    }

    if (permissionIds.size === 0) {
      return res.status(403).json({ error: `Forbidden: requires one of ${requiredPermissions.join(", ")}` })
    }

    const permissions = await rbacService.listPermissions({ id: Array.from(permissionIds) })
    const hasPerm = permissions.some((p: any) => requiredPermissions.includes(p.name) || p.name === "*")

    if (!hasPerm) {
      return res.status(403).json({ error: `Forbidden: requires one of ${requiredPermissions.join(", ")}` })
    }

    return next()
  } catch (error) {
    console.error("RBAC Middleware Error:", error)
    // If user not found or DB error, maybe let it proceed or deny
    return res.status(500).json({ error: "Internal Server Error checking permissions" })
  }
}
