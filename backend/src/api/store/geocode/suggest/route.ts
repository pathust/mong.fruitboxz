import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { suggestLocations } from "../../../../lib/geocoding"
import type { GeocodeSuggestQuery } from "../../../middlewares/validation"

export async function GET(req: MedusaRequest<unknown, GeocodeSuggestQuery>, res: MedusaResponse) {
  const { q, limit } = req.validatedQuery
  const suggestions = suggestLocations(q, limit)
  res.json({ suggestions })
}
