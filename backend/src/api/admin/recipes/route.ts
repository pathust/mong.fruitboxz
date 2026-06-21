import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { INGREDIENTS_MODULE } from "../../../modules/ingredients"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const ingredientsService = req.scope.resolve(INGREDIENTS_MODULE)
  const recipes = await ingredientsService.listRecipeItems({}, {
    relations: ["ingredient"]
  })
  res.json({ recipes })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const ingredientsService = req.scope.resolve(INGREDIENTS_MODULE)
  const { variant_id, ingredient_id, quantity } = req.body as any
  
  const recipe = await ingredientsService.createRecipeItems({
    variant_id,
    ingredient: ingredient_id,
    quantity: quantity ?? 1
  })
  
  res.status(201).json({ recipe })
}
