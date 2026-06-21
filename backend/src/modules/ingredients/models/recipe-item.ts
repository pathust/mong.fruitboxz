import { model } from "@medusajs/framework/utils"
import { Ingredient } from "./ingredient"

export const RecipeItem = model.define("recipe_item", {
  id: model.id().primaryKey(),
  variant_id: model.text().searchable(),
  quantity: model.number().default(1),
  ingredient: model.belongsTo(() => Ingredient, {
    mappedBy: "recipe_items",
  }),
})
