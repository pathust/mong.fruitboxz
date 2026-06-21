import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { INGREDIENTS_MODULE } from "../../../modules/ingredients"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve("query")
    const { data: ingredients } = await query.graph({
      entity: "ingredient",
      fields: ["*"],
    })
    const { data: recipeItems } = await query.graph({
      entity: "recipe_item",
      fields: ["*", "ingredient.*"],
      pagination: { skip: 0, take: 5000 }
    })
    res.json({ ingredients, recipeItems })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
