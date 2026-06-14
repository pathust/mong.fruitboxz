import { model } from "@medusajs/framework/utils"

const Role = model.define("role", {
  id: model.id().primaryKey(),
  name: model.text(),
  description: model.text().nullable(),
  guard_name: model.text().default("admin"),
  is_default: model.boolean().default(false),
  permissions: model.json().nullable(),
})

export default Role
