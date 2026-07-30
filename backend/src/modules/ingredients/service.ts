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

    const variantIds = items.map(i => i.variant_id)
    if (variantIds.length === 0) return deductions

    const recipes = await this.listRecipeItems({
      variant_id: variantIds
    }, {
      relations: ["ingredient"]
    })

    const itemQuantities = new Map(items.map(i => [i.variant_id, i.quantity]))

    for (const recipe of recipes) {
      const ingredient = recipe.ingredient as Record<string, unknown> | undefined
      if (ingredient && typeof ingredient.id === "string") {
        const orderedQty = itemQuantities.get(recipe.variant_id as string) || 0
        const deductAmount = (recipe.quantity as number) * orderedQty
        if (deductions[ingredient.id]) {
          deductions[ingredient.id] += deductAmount
        } else {
          deductions[ingredient.id] = deductAmount
        }
      }
    }
    
    return deductions
  }

}
