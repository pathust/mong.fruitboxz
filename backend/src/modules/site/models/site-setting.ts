import { model } from "@medusajs/framework/utils"

const SiteSetting = model.define("site_setting", {
  id: model.id().primaryKey(),
  key: model.text(),
  value: model.json().nullable(),
})

export default SiteSetting
