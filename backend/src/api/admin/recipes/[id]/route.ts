import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { INGREDIENTS_MODULE } from "../../../../modules/ingredients"
import type IngredientsModuleService from "../../../../modules/ingredients/service"
import { sendInternalError } from "../../../../lib/api-error"

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params

  try {
    const ingredientsService = req.scope.resolve<IngredientsModuleService>(INGREDIENTS_MODULE)

    const existing = await ingredientsService.retrieveRecipeItem(id).catch(() => null)
    if (!existing) {
      return res.status(404).json({ message: "Recipe item not found" })
    }

    await ingredientsService.deleteRecipeItems(id)

    res.json({ id, object: "recipe_item", deleted: true })
  } catch (error: unknown) {
    sendInternalError(req, res, error, "Unable to delete recipe item", "RECIPE_ITEM_DELETE_FAILED")
  }
}
