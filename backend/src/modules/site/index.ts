import SiteModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const SITE_MODULE = "site"

export default Module(SITE_MODULE, {
  service: SiteModuleService,
})
