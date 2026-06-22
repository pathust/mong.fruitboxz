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

  /**
   * Validate that there is enough stock for the required ingredients
   * Expected payload: Array<{ variant_id: string, quantity: number }>
   */
  async validateOrderIngredients(items: { variant_id: string; quantity: number }[]): Promise<void> {
    const variantIds = items.map((item) => item.variant_id)
    if (variantIds.length === 0) return

    const recipeItems = await this.listRecipeItems({
      variant_id: variantIds
    }, {
      relations: [
        "ingredient",
        "ingredient.inventory_item",
        "ingredient.inventory_item.location_levels"
      ]
    })

    const requiredIngredients: Record<string, { name: string, required: number, stock: number }> = {}

    for (const item of items) {
      const variantRecipeItems = (recipeItems as any[] || []).filter((r) => r.variant_id === item.variant_id)
      for (const reqItem of variantRecipeItems) {
        const ingId = reqItem.ingredient?.id
        if (!ingId) continue
        
        if (!requiredIngredients[ingId]) {
          const invItem = reqItem.ingredient?.inventory_item
          const stock = invItem?.location_levels?.reduce((sum: number, l: any) => sum + (l.stocked_quantity || 0), 0) || 0
          requiredIngredients[ingId] = {
            name: reqItem.ingredient?.name || "Nguyên liệu",
            required: 0,
            stock: stock
          }
        }
        
        requiredIngredients[ingId].required += (reqItem.quantity as number) * item.quantity
      }
    }

    for (const ingId in requiredIngredients) {
      const ing = requiredIngredients[ingId]
      if (ing.required > ing.stock) {
        throw new Error(`Đơn hàng vượt quá số lượng nguyên liệu trong kho. Vui lòng giảm số lượng. (Nguyên liệu: ${ing.name} - Cần: ${ing.required}, Còn: ${ing.stock})`)
      }
    }
  }
}
