import { model } from "@medusajs/framework/utils"

export const Vote = model.define("vote", {
  id: model.id().primaryKey(),
  customer_id: model.text(),
  product_id: model.text(),
  score: model.number(),
  comment: model.text().nullable(),
})
