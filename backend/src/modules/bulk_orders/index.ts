import { Module } from "@medusajs/framework/utils"
import BulkOrdersService from "./service"

export default Module("bulk_orders", {
  service: BulkOrdersService,
})
