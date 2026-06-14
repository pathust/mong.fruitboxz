import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { deleteMediaObject } from "../../../../lib/media"

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const objectKey = decodeURIComponent(req.params.object_key)
    await deleteMediaObject(objectKey)
    res.json({ ok: true })
  } catch (err: any) {
    res.status(500).json({ message: err?.message || "Failed to delete media" })
  }
}
