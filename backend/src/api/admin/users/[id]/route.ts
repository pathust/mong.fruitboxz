import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { UserBody } from "../../../middlewares/validation"
import { resolveUserService } from "../../../../lib/rbac"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const userService = resolveUserService(req.scope)
  const { id } = req.params
  const user = await userService.retrieveUser(id, {
    select: ["id", "email", "first_name", "last_name", "avatar_url", "metadata", "created_at", "updated_at"],
  })
  res.json({ user })
}

export async function POST(req: MedusaRequest<UserBody>, res: MedusaResponse) {
  const userService = resolveUserService(req.scope)
  const { id } = req.params
  const body = req.validatedBody
  const user = await userService.updateUsers({ id, ...body })
  res.json({ user })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const userService = resolveUserService(req.scope)
  const { id } = req.params
  await userService.deleteUsers([id])
  res.status(200).json({ id, deleted: true })
}
