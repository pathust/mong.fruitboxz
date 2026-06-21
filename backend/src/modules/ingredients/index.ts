import { Module } from "@medusajs/framework/utils"
import IngredientsModuleService from "./service"

export const INGREDIENTS_MODULE = "ingredients"

export default Module(INGREDIENTS_MODULE, {
  service: IngredientsModuleService,
})
