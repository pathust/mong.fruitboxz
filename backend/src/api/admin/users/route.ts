import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"

const CreateUserSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const userService = req.scope.resolve("user") as any
  const { email, q } = req.query as { email?: string; q?: string }

  const filters: any = {}
  if (email) filters.email = email
  if (q) filters.q = q

  const [users, count] = await userService.listAndCountUsers(filters, {
    select: ["id", "email", "first_name", "last_name", "avatar_url", "metadata", "created_at", "updated_at"],
  })

  res.json({ users, count })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parsed = CreateUserSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      error: "Dữ liệu không hợp lệ",
      details: parsed.error.format()
    })
  }

  const { email, first_name, last_name } = parsed.data
  const userService = req.scope.resolve("user") as any

  try {
    const user = await userService.createUsers({ email, first_name, last_name })
    res.status(201).json({ user })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}
