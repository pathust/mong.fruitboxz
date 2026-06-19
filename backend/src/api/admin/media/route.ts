import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { isObjectStorageEnabled, listMediaObjects } from "../../../lib/media"
import type { MediaListQuery } from "../../middlewares/validation"

export async function GET(req: MedusaRequest<unknown, MediaListQuery>, res: MedusaResponse) {
  try {
    const query = (req.validatedQuery.q || "").toLowerCase()
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
