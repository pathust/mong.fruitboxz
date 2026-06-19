import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { RolePermissionsBody } from "../../../../middlewares/validation"
import { resolveRbacService } from "../../../../../lib/module-services"

export async function POST(req: MedusaRequest<RolePermissionsBody>, res: MedusaResponse) {
  const rbacService = resolveRbacService(req.scope)
  const { id } = req.params
  const { permission_ids } = req.validatedBody

  const nextPerms = [...new Set(permission_ids)]
  await rbacService.updateRoles({ id, permissions: nextPerms })
  const role = await rbacService.retrieveRole(id)

  res.json({ role })
}
