import { defineLink } from "@medusajs/framework/utils"
import CustomerModule from "@medusajs/customer"
import SiteModule from "../modules/site"

export default defineLink(
  CustomerModule.linkable.customer,
  SiteModule.linkable.siteReview
)
