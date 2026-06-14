import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { suggestLocations } from "../../../../lib/geocoding"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const q = (req.query?.q || "").toString()
  const limit = Math.min(8, Math.max(1, Number(req.query?.limit || 6)))
  const suggestions = suggestLocations(q, limit)
  res.json({ suggestions })
}
