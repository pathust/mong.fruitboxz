import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/product"
import SiteModule from "../modules/site"

export default defineLink(
  ProductModule.linkable.product,
  SiteModule.linkable.siteReview
)
