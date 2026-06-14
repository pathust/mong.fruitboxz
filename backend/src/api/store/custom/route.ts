import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const mode = (req.query?.mode || "homepage").toString()
  if (mode !== "homepage") {
    return res.json({ ok: true })
  }

  try {
    const siteService = req.scope.resolve("site") as any
    const [settingsRows] = await siteService.listAndCountSiteSettings({ key: "global" })
    const [allBanners] = await siteService.listAndCountBanners({})
    const settings = settingsRows?.[0]?.value || {}
    const banners = (allBanners || [])
      .filter((b) => b?.active !== false)
      .sort((a, b) => Number(a?.order ?? 0) - Number(b?.order ?? 0))

    res.json({ settings, banners })
  } catch (err: any) {
    res.status(500).json({ error: err.message, stack: err.stack })
  }
}
