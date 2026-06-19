import { model } from "@medusajs/framework/utils"

export const BulkOrder = model.define("bulk_order", {
  id: model.id().primaryKey(),
  company_name: model.text(),
  contact_email: model.text(),
  contact_phone: model.text(),
  requested_date: model.dateTime(),
  budget: model.bigNumber(),
  note: model.text().nullable(),
  status: model.enum(["pending", "reviewed", "fulfilled", "cancelled"]).default("pending"),
})
