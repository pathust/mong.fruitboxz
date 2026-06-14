import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const authContext = (req as any).auth_context
  const actorId = authContext?.app_metadata?.user_id || authContext?.actor_id
  if (!actorId) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const userService = req.scope.resolve("user") as any
  const rbacService = req.scope.resolve("rbac") as any

  // Retrieve current user
  const user = await userService.retrieveUser(actorId, {
    select: ["id", "email", "metadata"],
  })

  // Superadmin check
  if (user.email === "taiphan@mong.vn") {
    return res.json({ permissions: ["*"] })
  }

  const roleIds = user.metadata?.roles || []
  if (!Array.isArray(roleIds) || roleIds.length === 0) {
    return res.json({ permissions: [] })
  }

  // Fetch roles to get their permission IDs
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
    return res.json({ permissions: [] })
  }

  // Fetch permissions to get their names
  const permissions = await rbacService.listPermissions({ id: Array.from(permissionIds) })

  const permissionNames = permissions.map((p: any) => p.name)

  res.json({ permissions: permissionNames })
}
