import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getGlobalSettings, updateGlobalSettings } from "../../../lib/global-settings"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const siteService = req.scope.resolve("site") as any
  const settings = await getGlobalSettings(siteService)
  res.json({ settings })
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const siteService = req.scope.resolve("site") as any
  const updates = req.body as any
  const merged = await updateGlobalSettings(siteService, updates)
  res.json({ settings: merged })
}
