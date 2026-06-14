import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { resolveShippingQuote } from "../../../../lib/geocoding"
import { getGlobalSettings } from "../../../../lib/global-settings"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const siteService = req.scope.resolve("site") as any
  const settings = await getGlobalSettings(siteService)
  const { address, city, district, lat, lng } = (req.body || {}) as {
    address?: string
    city?: string
    district?: string
    lat?: number
    lng?: number
  }
  const quote = resolveShippingQuote({ address, city, district, lat, lng }, settings)
  res.json(quote)
}
