import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { reverseGeocodeLocation } from "../../../../lib/geocoding"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const lat = Number(req.query?.lat)
  const lng = Number(req.query?.lng)

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Tọa độ không hợp lệ")
  }

  const location = await reverseGeocodeLocation(lat, lng)
  return res.json(location)
}
