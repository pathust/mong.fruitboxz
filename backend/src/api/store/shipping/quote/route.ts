import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { resolveShippingQuote } from "../../../../lib/geocoding"
import { getGlobalSettings } from "../../../../lib/global-settings"
import type { ShippingQuoteBody } from "../../../middlewares/validation"
import { resolveSiteService } from "../../../../lib/module-services"

export async function POST(req: MedusaRequest<ShippingQuoteBody>, res: MedusaResponse) {
  const siteService = resolveSiteService(req.scope)
  const settings = await getGlobalSettings(siteService)
  const { address, city, district, lat, lng } = req.validatedBody
  const quote = await resolveShippingQuote({ address, city, district, lat, lng }, settings)
  res.json(quote)
}
