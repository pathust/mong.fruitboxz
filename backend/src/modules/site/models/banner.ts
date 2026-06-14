import { model } from "@medusajs/framework/utils"

const Banner = model.define("site_banner", {
  id: model.id().primaryKey(),
  title: model.text(),
  subtitle: model.text().nullable(),
  image: model.text().nullable(),
  link: model.text().nullable(),
  order: model.number().default(0),
  active: model.boolean().default(true),
})

export default Banner
