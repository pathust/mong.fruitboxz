import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { ReverseGeocodeQuery } from "../../../middlewares/validation"
import ShippingModuleService from "../../../../modules/shipping/service"
import { SHIPPING_MODULE } from "../../../../modules/shipping"

export async function GET(req: MedusaRequest<unknown, ReverseGeocodeQuery>, res: MedusaResponse) {
  const { lat, lng } = req.validatedQuery
  const shippingService: ShippingModuleService = req.scope.resolve(SHIPPING_MODULE)
  const location = await shippingService.reverseGeocodeLocation(lat, lng)
  return res.json(location)
}
