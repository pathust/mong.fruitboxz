import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { GeocodeSuggestQuery } from "../../../middlewares/validation"
import ShippingModuleService from "../../../../modules/shipping/service"
import { SHIPPING_MODULE } from "../../../../modules/shipping"

export async function GET(req: MedusaRequest<unknown, GeocodeSuggestQuery>, res: MedusaResponse) {
  const { q, limit } = req.validatedQuery
  const shippingService: ShippingModuleService = req.scope.resolve(SHIPPING_MODULE)
  const suggestions = shippingService.suggestLocations(q, limit)
  res.json({ suggestions })
}
