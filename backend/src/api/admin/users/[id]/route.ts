import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const userService = req.scope.resolve("user") as any
  const { id } = req.params
  const user = await userService.retrieveUser(id, {
    select: ["id", "email", "first_name", "last_name", "avatar_url", "metadata", "created_at", "updated_at"],
  })
  res.json({ user })
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const userService = req.scope.resolve("user") as any
  const { id } = req.params
  const body = req.body as Record<string, unknown>
  const user = await userService.updateUsers({ id, ...body })
  res.json({ user })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const userService = req.scope.resolve("user") as any
  const { id } = req.params
  await userService.deleteUsers([id])
  res.status(200).json({ id, deleted: true })
}
