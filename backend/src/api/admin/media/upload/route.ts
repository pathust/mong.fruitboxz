import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { isObjectStorageEnabled, uploadMediaObject } from "../../../../lib/media"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { data, filename } = req.body as { data?: string; filename?: string }
    if (!data) {
      return res.status(400).json({ message: "Missing image data (base64)" })
    }

    const media = await uploadMediaObject({ data, filename })
    res.status(201).json({
      ...media,
      object_storage: isObjectStorageEnabled(),
    })
  } catch (err: any) {
    res.status(500).json({ message: err?.message || "Upload failed" })
  }
}
