import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { INGREDIENTS_MODULE } from "../../../../modules/ingredients"

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const ingredientsService = req.scope.resolve(INGREDIENTS_MODULE)
  
  await ingredientsService.deleteRecipeItems(id)
  
  res.json({ id, object: "recipe_item", deleted: true })
}
