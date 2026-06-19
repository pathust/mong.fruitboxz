import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { NameFilterQuery, PermissionBody } from "../../middlewares/validation"
import { resolveRbacService } from "../../../lib/module-services"

export async function GET(req: MedusaRequest<unknown, NameFilterQuery>, res: MedusaResponse) {
  const rbacService = resolveRbacService(req.scope)
  const { name } = req.validatedQuery
  const filters: { name?: string } = {}
  if (name) filters.name = name
  const [permissions, count] = await rbacService.listAndCountPermissions(filters)
  res.json({ permissions, count })
}

export async function POST(req: MedusaRequest<PermissionBody>, res: MedusaResponse) {
  const rbacService = resolveRbacService(req.scope)
  const permission = await rbacService.createPermissions(req.validatedBody)
  res.status(201).json({ permission })
}
