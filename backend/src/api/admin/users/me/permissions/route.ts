import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getUserPermissions } from "../../../../../lib/rbac"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const actorId = typeof req.auth_context.app_metadata?.user_id === "string"
    ? req.auth_context.app_metadata.user_id
    : req.auth_context.actor_id

  const permissions = await getUserPermissions(req.scope, actorId)
  res.json({ permissions })
}
