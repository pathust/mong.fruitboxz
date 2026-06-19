import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getGlobalSettings, updateGlobalSettings } from "../../../lib/global-settings"
import type { SettingsBody } from "../../middlewares/validation"
import { resolveSiteService } from "../../../lib/module-services"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const siteService = resolveSiteService(req.scope)
  const settings = await getGlobalSettings(siteService)
  res.json({ settings })
}

export async function POST(req: MedusaRequest<SettingsBody>, res: MedusaResponse) {
  const siteService = resolveSiteService(req.scope)
  const updates = req.validatedBody
  const merged = await updateGlobalSettings(siteService, updates)
  res.json({ settings: merged })
}
