import { defineLink } from "@medusajs/framework/utils"
import UserModule from "@medusajs/user"
import RbacModule from "../modules/rbac"

export default defineLink(
  UserModule.linkable.user,
  RbacModule.linkable.role
)
