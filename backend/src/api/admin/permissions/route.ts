import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const rbacService = req.scope.resolve("rbac") as any
  const { name } = req.query as { name?: string }
  const filters: any = {}
  if (name) filters.name = name
  const [permissions, count] = await rbacService.listAndCountPermissions(filters)
  res.json({ permissions, count })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const rbacService = req.scope.resolve("rbac") as any
  const permission = await rbacService.createPermissions(req.body)
  res.status(201).json({ permission })
}
