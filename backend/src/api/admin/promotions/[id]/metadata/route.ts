import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { updatePromotionsWorkflow } from "@medusajs/core-flows"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const metadata = req.body.metadata || {}

  try {
    await updatePromotionsWorkflow(req.scope).run({
      input: {
        promotionsData: [
          {
            id,
            metadata
          }
        ]
      }
    })

    res.json({ success: true })
  } catch (err) {
    console.error("Error updating promotion metadata", err)
    res.status(500).json({ message: "Failed to update metadata", error: err.message })
  }
}
