import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

function normalizeRoleName(name: unknown) {
  return String(name || "").trim().replace(/\s+/g, " ")
}

async function findDuplicateRole(rbacService: any, name: string) {
  const roles = await rbacService.listRoles({})
  return roles.find((role: any) => normalizeRoleName(role.name).toLowerCase() === name.toLowerCase())
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const rbacService = req.scope.resolve("rbac") as any
  const { name } = req.query as { name?: string }
  const filters: any = {}
  if (name) filters.name = name
  const [roles, count] = await rbacService.listAndCountRoles(filters)
  res.json({ roles, count })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const rbacService = req.scope.resolve("rbac") as any
  const body = req.body as Record<string, unknown>
  const name = normalizeRoleName(body.name)

  if (!name) {
    return res.status(400).json({ error: "Tên role là bắt buộc" })
  }

  const duplicate = await findDuplicateRole(rbacService, name)
  if (duplicate) {
    return res.status(409).json({ error: "Tên role đã tồn tại" })
  }

  const role = await rbacService.createRoles({ ...body, name })
  res.status(201).json({ role })
}
