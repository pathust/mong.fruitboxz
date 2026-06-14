import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const rbacService = req.scope.resolve("rbac") as any
  const { id } = req.params
  const permission = await rbacService.retrievePermission(id)
  res.json({ permission })
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const rbacService = req.scope.resolve("rbac") as any
  const { id } = req.params
  const body = req.body as Record<string, unknown>
  const permission = await rbacService.updatePermissions({ id, ...body })
  res.json({ permission })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const rbacService = req.scope.resolve("rbac") as any
  const { id } = req.params
  await rbacService.deletePermissions(id)
  res.status(200).json({ id, deleted: true })
}
