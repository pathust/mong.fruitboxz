import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { sendInternalError } from "../../../../lib/api-error"

type CartValidateBody = {
  items: Array<{
    variant_id: string
    quantity: number
  }>
}

export async function POST(req: MedusaRequest<CartValidateBody>, res: MedusaResponse) {
  const { items } = req.body || { items: [] }
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.json({ valid: true, items: [] })
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const variantIds = items.map(i => i.variant_id).filter(Boolean)

  try {
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

    const { data: variants } = await query.graph({
      entity: "variant",
      fields: [
        "id",
        "title",
        "manage_inventory",
        "allow_backorder",
        "inventory_items.*",
        "inventory_items.inventory.*",
        "inventory_items.inventory.location_levels.*"
      ],
      filters: { id: variantIds }
    })

    const requiredIngredients: Record<string, { name: string, required: number, stock: number }> = {}

    for (const item of items) {
      if (!item.variant_id) continue;
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
        
        requiredIngredients[ingId].required += reqItem.quantity * item.quantity
      }
    }

    let valid = true
    let message = ""
    for (const ingId in requiredIngredients) {
      const ing = requiredIngredients[ingId]
      if (ing.required > ing.stock) {
        valid = false
        message = `Đơn hàng vượt quá số lượng nguyên liệu trong kho. Thiếu: ${ing.name} (Cần: ${ing.required}, Còn: ${ing.stock})`
        break
      }
    }

    // Also compute standalone maxAllowed for each variant to help frontend adjust
    const maxAllowedPerVariant: Record<string, number | null> = {}
    for (const vid of variantIds) {
      const variantRecipeItems = (recipeItems as any[] || []).filter((r) => r.variant_id === vid)
      const variantNode = (variants as any[] || []).find(v => v.id === vid)
      
      if (variantRecipeItems.length > 0) {
        let minCount = Infinity
        for (const reqItem of variantRecipeItems) {
          const ingId = reqItem.ingredient?.id
          if (!ingId) continue
          const stock = requiredIngredients[ingId]?.stock || 0
          const qty = reqItem.quantity || 1
          const count = Math.floor(stock / qty)
          if (count < minCount) minCount = count
        }
        const actualCount = minCount === Infinity ? 0 : minCount
        maxAllowedPerVariant[vid] = actualCount
      } else {
        // Simple product without BOM
        if (variantNode && variantNode.manage_inventory && !variantNode.allow_backorder) {
          const invItems = variantNode.inventory_items || []
          let totalStock = 0
          for (const vi of invItems) {
            const inventory = vi.inventory || vi.inventory_item
            if (inventory && inventory.location_levels) {
              totalStock += inventory.location_levels.reduce((sum: number, l: any) => sum + (l.stocked_quantity || 0), 0)
            }
          }
          maxAllowedPerVariant[vid] = totalStock
          
          // Also check validation for this simple product right here
          const cartItem = items.find(i => i.variant_id === vid)
          if (cartItem && cartItem.quantity > totalStock && valid) {
            valid = false
            message = `Sản phẩm ${variantNode.title || 'này'} chỉ còn ${totalStock} trong kho.`
          }
        } else {
          maxAllowedPerVariant[vid] = null
        }
      }
    }

    return res.json({
      valid,
      message,
      standalone_max_allowed: maxAllowedPerVariant
    })
  } catch (error: unknown) {
    return sendInternalError(req, res, error, "Không thể kiểm tra tồn kho giỏ hàng", "CART_VALIDATE_FAILED")
  }
}
