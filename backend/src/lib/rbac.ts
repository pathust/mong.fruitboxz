import { resolveRbacService, type ServiceScope } from "./module-services"

type AdminUser = {
  id: string
  email: string
  first_name?: string | null
  last_name?: string | null
  avatar_url?: string | null
  metadata?: Record<string, unknown> | null
  created_at?: Date | string
  updated_at?: Date | string
}

export type UserModuleService = {
  retrieveUser(id: string, config?: Record<string, unknown>): Promise<AdminUser>
  listAndCountUsers(filters: Record<string, unknown>, config?: Record<string, unknown>): Promise<[AdminUser[], number]>
  createUsers(input: Record<string, unknown>): Promise<AdminUser>
  updateUsers(input: Record<string, unknown>): Promise<AdminUser>
  deleteUsers(ids: string[]): Promise<void>
}

export function resolveUserService(scope: ServiceScope) {
  return scope.resolve<UserModuleService>("user")
}

function isSuperAdmin(user: AdminUser) {
  if (user.metadata?.is_super_admin === true) return true
  const configuredEmails = String(process.env.SUPER_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)

  return configuredEmails.includes(user.email.toLowerCase())
}

export async function getUserPermissions(scope: ServiceScope, userId: string): Promise<string[]> {
  const userService = resolveUserService(scope)
  const rbacService = resolveRbacService(scope)
  const user = await userService.retrieveUser(userId, {
    select: ["id", "email", "metadata"],
  })

  if (isSuperAdmin(user)) return ["*"]

  const rawRoleIds = user.metadata?.roles
  const roleIds = Array.isArray(rawRoleIds)
    ? rawRoleIds.filter((id): id is string => typeof id === "string")
    : []
  if (!roleIds.length) return []

  const roles = await rbacService.listRoles({ id: roleIds })
  const permissionIds = new Set<string>()
  for (const role of roles) {
    if (!Array.isArray(role.permissions)) continue
    for (const id of role.permissions) {
      if (typeof id === "string") permissionIds.add(id)
    }
  }
  if (!permissionIds.size) return []

  const permissions = await rbacService.listPermissions({ id: [...permissionIds] })
  return permissions.map((permission) => permission.name)
}
