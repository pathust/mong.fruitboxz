import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export type ValidateInventoryInput = {
  items: Array<{ variant_id?: string | null; quantity: number }>
}

export const validateInventoryStepId = "validate-inventory-step"

export const validateInventoryStep = createStep(
  validateInventoryStepId,
  async (input: ValidateInventoryInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const variantIds = input.items.map((item) => item.variant_id).filter(Boolean)

    if (variantIds.length === 0) {
      return new StepResponse({ success: true })
    }

    const { data: recipeItems } = await query.graph({
      entity: "recipe_item",
      fields: [
        "*",
        "ingredient.*",
        "ingredient.inventory_item.*",
        "ingredient.inventory_item.location_levels.*"
      ],
      filters: { variant_id: variantIds }
    })

    const itemsMap = new Map()
    for (const item of (recipeItems || [])) {
      if (!itemsMap.has(item.variant_id)) itemsMap.set(item.variant_id, [])
      itemsMap.get(item.variant_id).push(item)
    }

    // Determine required quantities for each ingredient based on the items in the order
    const requiredIngredientMap = new Map()
    for (const item of input.items) {
      const reqItems = itemsMap.get(item.variant_id) || []
      for (const reqItem of reqItems) {
        if (!reqItem.ingredient) continue
        const ingredientId = reqItem.ingredient.id
        const currentTotal = requiredIngredientMap.get(ingredientId) || {
          quantity: 0,
          title: reqItem.ingredient.title,
          inventory_item: reqItem.ingredient.inventory_item
        }
        currentTotal.quantity += (reqItem.quantity * item.quantity)
        requiredIngredientMap.set(ingredientId, currentTotal)
      }
    }

    // Validate the required amounts against available stock
    for (const [ingredientId, requirement] of requiredIngredientMap.entries()) {
      const invItem = requirement.inventory_item
      if (!invItem) continue

      const stock = invItem.location_levels?.reduce((sum: number, l: any) => sum + (l.stocked_quantity || 0), 0) || 0
      if (stock < requirement.quantity) {
        throw new Error(`Sản phẩm vượt quá số lượng nguyên liệu tồn kho (${requirement.title}: cần ${requirement.quantity}, chỉ còn ${stock})`)
      }
    }

    return new StepResponse({ success: true })
  }
)
