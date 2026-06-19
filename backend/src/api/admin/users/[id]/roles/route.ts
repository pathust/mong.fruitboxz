import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { UserRolesBody } from "../../../../middlewares/validation"
import { resolveUserService } from "../../../../../lib/rbac"

export async function POST(req: MedusaRequest<UserRolesBody>, res: MedusaResponse) {
  const userService = resolveUserService(req.scope)
  const { id } = req.params
  const { role_ids, roles } = req.validatedBody
  const requestedRoles = roles || role_ids

  if (!Array.isArray(requestedRoles)) {
    return res.status(400).json({ error: "roles must be an array" })
  }

  const user = await userService.retrieveUser(id)
  const nextRoles = [...new Set(requestedRoles)]

  const updated = await userService.updateUsers({
    id,
    metadata: { ...(user.metadata || {}), roles: nextRoles },
  })

  res.json({ user: { ...updated, roles: nextRoles } })
}
