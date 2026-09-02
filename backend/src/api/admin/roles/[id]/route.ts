import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { RoleBody } from "../../../middlewares/validation"
import { resolveRbacService } from "../../../../lib/module-services"
import { resolveUserService } from "../../../../lib/rbac"
import RbacModuleService, { toPermissionsJson } from "../../../../modules/rbac/service"
import { sendInternalError } from "../../../../lib/api-error"

function normalizeRoleName(name: unknown) {
  return String(name || "").trim().replace(/\s+/g, " ")
}

async function findDuplicateRole(rbacService: RbacModuleService, name: string, currentId: string) {
  const roles = await rbacService.listRoles({})
  return roles.find((role) => {
    return role.id !== currentId && normalizeRoleName(role.name).toLowerCase() === name.toLowerCase()
  })
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const rbacService = resolveRbacService(req.scope)
  const { id } = req.params
  const role = await rbacService.retrieveRole(id)
  res.json({ role })
}

export async function POST(req: MedusaRequest<RoleBody>, res: MedusaResponse) {
  const rbacService = resolveRbacService(req.scope)
  const { id } = req.params
  const body = req.validatedBody
  const name = normalizeRoleName(body.name)

  if ("name" in body && !name) {
    return res.status(400).json({ error: "Tên role là bắt buộc" })
  }

  if (name) {
    const duplicate = await findDuplicateRole(rbacService, name, id)
    if (duplicate) {
      return res.status(409).json({ error: "Tên role đã tồn tại" })
    }
  }

  const { permissions, ...restBody } = body
  const role = await rbacService.updateRoles({
    id,
    ...restBody,
    ...(name ? { name } : {}),
    ...(permissions !== undefined ? { permissions: toPermissionsJson(permissions) } : {}),
  })
  res.json({ role })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const rbacService = resolveRbacService(req.scope)
  const { id } = req.params

  try {
    const role = await rbacService.retrieveRole(id).catch(() => null)
    if (!role) {
      return res.status(404).json({ error: "Role không tồn tại" })
    }

    const userService = resolveUserService(req.scope)
    const [users] = await userService.listAndCountUsers({}, { take: 1000, select: ["id", "email", "metadata"] })
    const assignedUser = users.find((user) => {
      const roleIds = user.metadata?.roles
      return Array.isArray(roleIds) && roleIds.includes(id)
    })
    if (assignedUser) {
      return res.status(409).json({
        error: `Không thể xoá role đang được gán cho người dùng "${assignedUser.email}"`,
      })
    }

    await rbacService.deleteRoles(id)
    res.status(200).json({ id, deleted: true })
  } catch (error: unknown) {
    sendInternalError(req, res, error, "Unable to delete role", "ROLE_DELETE_FAILED")
  }
}
