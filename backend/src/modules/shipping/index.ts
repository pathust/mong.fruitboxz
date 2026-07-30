import ShippingModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const SHIPPING_MODULE = "shipping"

export default Module(SHIPPING_MODULE, {
  service: ShippingModuleService,
})
