import { model } from "@medusajs/framework/utils"
import { RecipeItem } from "./recipe-item"

export const Ingredient = model.define("ingredient", {
  id: model.id().primaryKey(),
  name: model.text(),
  type: model.enum(["fruit", "dip_sauce", "mix_sauce", "yogurt", "other"]).default("other"),
  unit: model.text().default("piece"),
  cost_price: model.number().nullable(),
  recipe_items: model.hasMany(() => RecipeItem)
})
