import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const productModule = req.scope.resolve(Modules.PRODUCT)

  try {
    const { data } = await query.graph({
      entity: "ingredient",
      fields: ["*", "recipe_items.*"],
      filters: { id }
    })

    if (!data.length) {
      return res.status(404).json({ message: "Ingredient not found" })
    }

    const ingredient = data[0] as any
    const recipeItems = ingredient.recipe_items || []
    
    if (recipeItems.length === 0) {
      return res.json({ products: [] })
    }

    const variantIds = recipeItems.map((item: any) => item.variant_id)

    // Fetch product variants to get product titles
    const variants = await productModule.listProductVariants(
      { id: variantIds },
      { relations: ["product"] }
    )

    const products = variants.map(v => v.product?.title).filter(Boolean)
    // Remove duplicates
    const uniqueProducts = Array.from(new Set(products))

    res.json({ products: uniqueProducts })
  } catch (err: any) {
    res.status(500).json({ message: "Error fetching usage" })
  }
}
