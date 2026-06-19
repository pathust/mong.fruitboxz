import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { reverseGeocodeLocation } from "../../../../lib/geocoding"
import type { ReverseGeocodeQuery } from "../../../middlewares/validation"

export async function GET(req: MedusaRequest<unknown, ReverseGeocodeQuery>, res: MedusaResponse) {
  const { lat, lng } = req.validatedQuery

  const location = await reverseGeocodeLocation(lat, lng)
  return res.json(location)
}
