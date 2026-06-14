import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const rbacService = req.scope.resolve("rbac") as any
  const { id } = req.params
  const role = await rbacService.retrieveRole(id)
  res.json({ role })
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const rbacService = req.scope.resolve("rbac") as any
  const { id } = req.params
  const body = req.body as Record<string, unknown>
  const role = await rbacService.updateRoles({ id, ...body })
  res.json({ role })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const rbacService = req.scope.resolve("rbac") as any
  const { id } = req.params
  await rbacService.deleteRoles(id)
  res.status(200).json({ id, deleted: true })
}
