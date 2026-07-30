import { model } from "@medusajs/framework/utils"

const Review = model.define("site_review", {
  id: model.id().primaryKey(),
  handle: model.text(),
  product_id: model.text().nullable(),
  customer_id: model.text(),
  rating: model.number(),
  comment: model.text().nullable(),
  approved: model.boolean().default(true),
})

export default Review
