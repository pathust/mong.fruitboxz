import { MedusaService } from "@medusajs/framework/utils"
import { Role, Permission } from "./models"

import { defineJoinerConfig } from "@medusajs/framework/utils"

export const joinerConfig = defineJoinerConfig("rbac", {
  linkableKeys: {
    rbac_role_id: "Role",
    rbac_permission_id: "Permission",
  }
})

class RbacModuleService extends MedusaService({
  Role,
  Permission,
}) {
  __joinerConfig() {
    return joinerConfig
  }
}

export default RbacModuleService

// `Role.permissions` is a `model.json()` column (see ./models/role.ts).
// Medusa's model DSL has no generic form for json fields, so the
// create/update signatures MedusaService generates for it default to
// `Record<string, unknown> | null`. Every actual read/write in this
// codebase treats it as a plain `string[]` of permission ids (see
// backend/src/lib/rbac.ts's `Array.isArray(role.permissions)` check) —
// this is the single place that bridges that gap for callers.
export function toPermissionsJson(permissions?: string[] | null) {
  return permissions as unknown as Record<string, unknown> | null | undefined
}
