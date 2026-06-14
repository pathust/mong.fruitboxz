import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { isObjectStorageEnabled, listMediaObjects } from "../../../lib/media"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = (req.query?.q || "").toString().trim().toLowerCase()
    const images = await listMediaObjects()
    const filtered = query
      ? images.filter((item) => item.filename.toLowerCase().includes(query))
      : images
    res.json({
      images: filtered,
      total: filtered.length,
      object_storage: isObjectStorageEnabled(),
    })
  } catch (err) {
    res.status(500).json({ message: "Failed to list images" })
  }
}
