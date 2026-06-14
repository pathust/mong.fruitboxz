import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const userService = req.scope.resolve("user") as any
  const { id } = req.params
  const { role_ids } = req.body as { role_ids: string[] }

  if (!Array.isArray(role_ids)) {
    return res.status(400).json({ error: "role_ids must be an array" })
  }

  const user = await userService.retrieveUser(id)
  const nextRoles = [...new Set(role_ids)]

  const updated = await userService.updateUsers({
    id,
    metadata: { ...(user.metadata || {}), roles: nextRoles },
  })

  res.json({ user: { ...updated, roles: nextRoles } })
}
