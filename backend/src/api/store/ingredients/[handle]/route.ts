import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { INGREDIENTS_MODULE } from "../../../../modules/ingredients"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const handle = (req.params.handle || "").toString()
  if (!handle) return res.status(400).json({ message: "Missing product handle" })

  const query = req.scope.resolve("query")
  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "variants.id"
    ],
    filters: {
      handle: handle
    }
  })

  let ingredientsSet = new Set<string>()

  if (products && products.length > 0) {
    const product = products[0]
    const variantIds = product.variants?.map(v => v.id) || []
    
    if (variantIds.length > 0) {
      const ingredientsService = req.scope.resolve(INGREDIENTS_MODULE)
      const recipeItems = await ingredientsService.listRecipeItems({
        variant_id: variantIds
      }, {
        relations: ["ingredient"]
      })

      for (const rcp of recipeItems) {
        if (rcp.ingredient?.name) {
          ingredientsSet.add(rcp.ingredient.name)
        }
      }
    }
  }

  // Fallback to defaults if no custom ingredients exist
  let ingredients = Array.from(ingredientsSet)
  if (ingredients.length === 0) {
    ingredients = ["Trái cây tươi theo mùa", "Muối hồng", "Sốt chanh dây nhẹ"]
  }

  res.json({ handle, ingredients })
}
