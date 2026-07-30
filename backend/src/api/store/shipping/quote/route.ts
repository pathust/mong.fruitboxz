import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getGlobalSettings } from "../../../../lib/global-settings"
import type { ShippingQuoteBody } from "../../../middlewares/validation"
import { resolveSiteService } from "../../../../lib/module-services"
import ShippingModuleService from "../../../../modules/shipping/service"
import { SHIPPING_MODULE } from "../../../../modules/shipping"

export async function POST(req: MedusaRequest<ShippingQuoteBody>, res: MedusaResponse) {
  const siteService = resolveSiteService(req.scope)
  const settings = await getGlobalSettings(siteService)
  const { address, city, district, lat, lng } = req.validatedBody
  
  const shippingService: ShippingModuleService = req.scope.resolve(SHIPPING_MODULE)
  const quote = await shippingService.resolveShippingQuote({ address, city, district, lat, lng }, settings)
  res.json(quote)
}
