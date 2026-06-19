import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { RoleBody } from "../../../middlewares/validation"
import { resolveRbacService } from "../../../../lib/module-services"
import type RbacModuleService from "../../../../modules/rbac/service"

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

  const role = await rbacService.updateRoles({ id, ...body, ...(name ? { name } : {}) })
  res.json({ role })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const rbacService = resolveRbacService(req.scope)
  const { id } = req.params
  await rbacService.deleteRoles(id)
  res.status(200).json({ id, deleted: true })
}
