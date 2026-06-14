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
    "permissions", "settings", "reviews", "media", "search", "chatbot"
  ])

  // Standardize module names for permissions
  let permModule = moduleName
  if (moduleName === "product-categories") permModule = "categories"

  if (!readModules.has(moduleName)) {
    return next()
  }

  const requiredAction = (method === "GET" || method === "OPTIONS") ? "read" : "write"
  const requiredPermission = `${permModule}.${requiredAction}`

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
      return res.status(403).json({ error: `Forbidden: requires ${requiredPermission}` })
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
      return res.status(403).json({ error: `Forbidden: requires ${requiredPermission}` })
    }

    const permissions = await rbacService.listPermissions({ id: Array.from(permissionIds) })
    const hasPerm = permissions.some((p: any) => p.name === requiredPermission || p.name === "*")

    if (!hasPerm) {
      return res.status(403).json({ error: `Forbidden: requires ${requiredPermission}` })
    }

    return next()
  } catch (error) {
    console.error("RBAC Middleware Error:", error)
    // If user not found or DB error, maybe let it proceed or deny
    return res.status(500).json({ error: "Internal Server Error checking permissions" })
  }
}
