import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { CreateUserBody, UserListQuery } from "../../middlewares/validation"
import { sendInternalError } from "../../../lib/api-error"
import { resolveUserService } from "../../../lib/rbac"

export async function GET(req: MedusaRequest<unknown, UserListQuery>, res: MedusaResponse) {
  const userService = resolveUserService(req.scope)
  const { email, q } = req.validatedQuery

  const filters: { email?: string; q?: string } = {}
  if (email) filters.email = email
  if (q) filters.q = q

  const [users, count] = await userService.listAndCountUsers(filters, {
    select: ["id", "email", "first_name", "last_name", "avatar_url", "metadata", "created_at", "updated_at"],
  })

  res.json({ users, count })
}

export async function POST(req: MedusaRequest<CreateUserBody>, res: MedusaResponse) {
  const { email, first_name, last_name } = req.validatedBody
  const userService = resolveUserService(req.scope)

  try {
    const user = await userService.createUsers({ email, first_name, last_name })
    res.status(201).json({ user })
  } catch (error: unknown) {
    sendInternalError(req, res, error, "Unable to create admin user", "USER_CREATE_FAILED")
  }
}
