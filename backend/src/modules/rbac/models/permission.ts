import { model } from "@medusajs/framework/utils"

const Permission = model.define("permission", {
  id: model.id().primaryKey(),
  name: model.text(),
  description: model.text().nullable(),
  guard_name: model.text().default("admin"),
})

export default Permission
