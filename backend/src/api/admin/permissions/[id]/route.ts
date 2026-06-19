import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { PermissionBody } from "../../../middlewares/validation"
import { resolveRbacService } from "../../../../lib/module-services"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const rbacService = resolveRbacService(req.scope)
  const { id } = req.params
  const permission = await rbacService.retrievePermission(id)
  res.json({ permission })
}

export async function POST(req: MedusaRequest<PermissionBody>, res: MedusaResponse) {
  const rbacService = resolveRbacService(req.scope)
  const { id } = req.params
  const body = req.validatedBody
  const permission = await rbacService.updatePermissions({ id, ...body })
  res.json({ permission })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const rbacService = resolveRbacService(req.scope)
  const { id } = req.params
  await rbacService.deletePermissions(id)
  res.status(200).json({ id, deleted: true })
}
