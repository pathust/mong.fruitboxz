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
