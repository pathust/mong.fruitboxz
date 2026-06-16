import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const userService = req.scope.resolve("user") as any
  const { id } = req.params
  const { role_ids, roles } = req.body as { role_ids?: string[]; roles?: string[] }
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
