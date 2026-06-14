import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const rbacService = req.scope.resolve("rbac") as any
  const { id } = req.params
  const { permission_ids } = req.body as { permission_ids: string[] }

  if (!Array.isArray(permission_ids)) {
    return res.status(400).json({ error: "permission_ids must be an array" })
  }

  const nextPerms = [...new Set(permission_ids)]
  await rbacService.updateRoles({ id, permissions: nextPerms })
  const role = await rbacService.retrieveRole(id)

  res.json({ role })
}
