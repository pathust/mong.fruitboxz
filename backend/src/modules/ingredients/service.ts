import { MedusaService } from "@medusajs/framework/utils"
import { Ingredient } from "./models/ingredient"
import { RecipeItem } from "./models/recipe-item"

export default class IngredientsModuleService extends MedusaService({
  Ingredient,
  RecipeItem,
}) {
  /**
   * Deduct inventory for ingredients based on the variants ordered.
   * Expected payload: Array<{ variant_id: string, quantity: number }>
   */
  async deductIngredientsForVariants(
    items: { variant_id: string; quantity: number }[]
  ): Promise<Record<string, number>> {
    const deductions: Record<string, number> = {}

    for (const item of items) {
      const recipes = await this.listRecipeItems({
        variant_id: item.variant_id
      }, {
        relations: ["ingredient"]
      })

      for (const recipe of recipes) {
        const ingredient = recipe.ingredient as any
        if (ingredient) {
          const deductAmount = recipe.quantity * item.quantity
          if (deductions[ingredient.id]) {
            deductions[ingredient.id] += deductAmount
          } else {
            deductions[ingredient.id] = deductAmount
          }
        }
      }
    }
    
    return deductions
  }
}
