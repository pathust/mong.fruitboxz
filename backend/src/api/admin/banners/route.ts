import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const siteService = req.scope.resolve("site") as any
    const [banners] = await siteService.listAndCountBanners({})
    res.json({ banners })
  } catch (error: any) {
    res.status(500).json({ message: error.message || "An error occurred while fetching banners" })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const siteService = req.scope.resolve("site") as any
    const body = req.body as any

    if (!body || typeof body !== "object") {
      return res.status(400).json({ message: "Invalid payload" })
    }

    const [existing] = await siteService.listAndCountBanners({})
    const banner = await siteService.createBanners({
      title: body.title || "",
      subtitle: body.subtitle || "",
      image: body.image || "",
      link: body.link || "",
      order: body.order ?? existing.length,
      active: body.active ?? true,
    })
    res.status(201).json({ banner })
  } catch (error: any) {
    res.status(500).json({ message: error.message || "An error occurred while creating banner" })
  }
}
