import { model } from "@medusajs/framework/utils"

const ContactMessage = model.define("site_contact_message", {
  id: model.id().primaryKey(),
  name: model.text(),
  email: model.text(),
  phone: model.text().nullable(),
  message: model.text(),
  status: model.text().default("new"),
})

export default ContactMessage
