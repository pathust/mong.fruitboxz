import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { INGREDIENTS_MODULE } from "../../../modules/ingredients"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const ingredientsService = req.scope.resolve(INGREDIENTS_MODULE)
    
    const variantsToDeduct = [{ variant_id: "variant_01KSRXBSTT5P2DP8WSXQRWP63C", quantity: 3 }]
    await ingredientsService.deductIngredientsForVariants(variantsToDeduct)

    const after = await ingredientsService.listIngredients({ id: "ing_test_123" })

    res.json({ message: "Deducted successfully", after })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}
