import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { NameFilterQuery, RoleBody } from "../../middlewares/validation"
import { resolveRbacService } from "../../../lib/module-services"
import type RbacModuleService from "../../../modules/rbac/service"

function normalizeRoleName(name: unknown) {
  return String(name || "").trim().replace(/\s+/g, " ")
}

async function findDuplicateRole(rbacService: RbacModuleService, name: string) {
  const roles = await rbacService.listRoles({})
  return roles.find((role) => normalizeRoleName(role.name).toLowerCase() === name.toLowerCase())
}

export async function GET(req: MedusaRequest<unknown, NameFilterQuery>, res: MedusaResponse) {
  const rbacService = resolveRbacService(req.scope)
  const { name } = req.validatedQuery
  const filters: { name?: string } = {}
  if (name) filters.name = name
  const [roles, count] = await rbacService.listAndCountRoles(filters)
  res.json({ roles, count })
}

export async function POST(req: MedusaRequest<RoleBody>, res: MedusaResponse) {
  const rbacService = resolveRbacService(req.scope)
  const body = req.validatedBody
  const name = normalizeRoleName(body.name)

  if (!name) {
    return res.status(400).json({ error: "Tên role là bắt buộc" })
  }

  const duplicate = await findDuplicateRole(rbacService, name)
  if (duplicate) {
    return res.status(409).json({ error: "Tên role đã tồn tại" })
  }

  const role = await rbacService.createRoles({ ...body, name })
  res.status(201).json({ role })
}
